import io
import os
import zipfile
from glob import glob
from tempfile import TemporaryDirectory
from typing import Dict, List, Sequence, Type

import datumaro as dm
import numpy as np
from attrs import define
from defusedxml import ElementTree as ET

from src.core.annotation_meta import ANNOTATION_METAFILE_NAME, AnnotationMeta, JobMeta
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.types import TaskType
from src.handlers.job_creation import DM_DATASET_FORMAT_MAPPING
from src.models.cvat import Image, Job
from src.services.cloud.utils import BucketAccessInfo
from src.utils.assignments import compose_data_bucket_filename
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

CVAT_EXPORT_FORMAT_MAPPING = {
    TaskType.image_label_binary: "CVAT for images 1.1",
    TaskType.image_points: "CVAT for images 1.1",
    TaskType.image_boxes: "COCO 1.0",
    TaskType.image_boxes_from_points: "COCO 1.0",
}

CVAT_EXPORT_FORMAT_TO_DM_MAPPING = {
    "CVAT for images 1.1": "cvat",
    "COCO 1.0": "coco_instances",
}


@define
class FileDescriptor:
    filename: str
    file: io.RawIOBase


def prepare_annotation_metafile(
    jobs: List[Job], job_annotations: Dict[int, FileDescriptor]
) -> FileDescriptor:
    """
    Prepares a task/project annotation descriptor file with annotator mapping.
    """

    meta = AnnotationMeta(
        jobs=[
            JobMeta(
                job_id=job.cvat_id,
                annotation_filename=job_annotations[job.cvat_id].filename,
                annotator_wallet_address=job.latest_assignment.user_wallet_address,
                assignment_id=job.latest_assignment.id,
            )
            for job in jobs
        ]
    )

    return FileDescriptor(ANNOTATION_METAFILE_NAME, file=io.BytesIO(meta.json().encode()))


def flatten_points(input_points: List[dm.Points]) -> List[dm.Points]:
    results = []

    for pts in input_points:
        for point_idx in range(len(pts.points) // 2):
            point_x = pts.points[2 * point_idx + 0]
            point_y = pts.points[2 * point_idx + 1]
            results.append(dm.Points([point_x, point_y], label=pts.label))

    return results


def fix_cvat_annotations(dataset_root: str):
    for annotation_filename in glob(os.path.join(dataset_root, "**/*.xml"), recursive=True):
        with open(annotation_filename, "rb+") as f:
            doc = ET.parse(f)
            doc_root = doc.getroot()

            if doc_root.find("meta/project"):
                # put labels into each task, if needed
                # datumaro doesn't support /meta/project/ tag, but works with tasks,
                # which is nested in the meta/project/
                labels_element = doc_root.find("meta/project/labels")
                if not labels_element:
                    continue

                for task_element in doc_root.iterfind("meta/project/tasks/task"):
                    task_element.append(labels_element)
            elif job_meta := doc_root.find("meta/job"):
                # just rename the job into task for the same reasons
                job_meta.tag = "task"
            else:
                continue

            f.seek(0)
            f.truncate()
            doc.write(f, encoding="utf-8")


def convert_point_arrays_dataset_to_1_point_skeletons(
    dataset: dm.Dataset, labels: List[str]
) -> dm.Dataset:
    def _get_skeleton_label(original_label: str) -> str:
        return original_label + "_sk"

    new_label_cat = dm.LabelCategories.from_iterable(
        [_get_skeleton_label(label) for label in labels]
        + [(label, _get_skeleton_label(label)) for label in labels]
    )
    new_points_cat = dm.PointsCategories.from_iterable(
        (new_label_cat.find(_get_skeleton_label(label))[0], [label]) for label in labels
    )
    converted_dataset = dm.Dataset(
        categories={
            dm.AnnotationType.label: new_label_cat,
            dm.AnnotationType.points: new_points_cat,
        },
        media_type=dm.Image,
    )

    label_id_map: Dict[int, int] = {
        original_id: new_label_cat.find(label.name, parent=_get_skeleton_label(label.name))[0]
        for original_id, label in enumerate(dataset.categories()[dm.AnnotationType.label])
    }  # old id -> new id

    for sample in dataset:
        points = [a for a in sample.annotations if isinstance(a, dm.Points)]
        points = flatten_points(points)

        skeletons = [
            dm.Skeleton(
                [p.wrap(label=label_id_map[p.label])],
                label=new_label_cat.find(_get_skeleton_label(labels[p.label]))[0],
            )
            for p in points
        ]

        converted_dataset.put(sample.wrap(annotations=skeletons))

    return converted_dataset


def remove_duplicated_gt_frames(dataset: dm.Dataset, known_frames: Sequence[str]):
    """
    Removes unknown images from the dataset inplace.

    On project dataset export, CVAT will add GT frames, which repeat in multiple tasks,
    with a suffix. We don't need these frames in the resulting dataset,
    and we can safely remove them.
    """
    if not isinstance(known_frames, set):
        known_frames = set(known_frames)

    for sample in list(dataset):
        item_image_filename = sample.media.path

        if item_image_filename not in known_frames:
            dataset.remove(sample.id, sample.subset)


class _TaskProcessor:
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        annotations: List[FileDescriptor],
        merged_annotation: FileDescriptor,
        *,
        manifest: TaskManifest,
        project_images: List[Image],
    ):
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.annotations = annotations
        self.merged_annotation = merged_annotation
        self.manifest = manifest
        self.project_images = project_images

    def process(self):
        with TemporaryDirectory() as tempdir:
            for ann_descriptor in self.annotations:
                if not zipfile.is_zipfile(ann_descriptor.file):
                    raise ValueError("Annotation files must be zip files")
                ann_descriptor.file.seek(0)

                extract_dir = os.path.join(
                    tempdir,
                    os.path.splitext(os.path.basename(ann_descriptor.filename))[0],
                )
                extract_zip_archive(ann_descriptor.file, extract_dir)

                export_dir = os.path.join(
                    tempdir,
                    os.path.splitext(os.path.basename(ann_descriptor.filename))[0] + "_conv",
                )

                self._process_annotation_file(ann_descriptor, extract_dir, export_dir)

                converted_dataset_archive = io.BytesIO()
                write_dir_to_zip_archive(export_dir, converted_dataset_archive)
                converted_dataset_archive.seek(0)

                ann_descriptor.file = converted_dataset_archive

    def _process_annotation_file(
        self, ann_descriptor: FileDescriptor, input_dir: str, output_dir: str
    ):
        task_type = self.manifest.annotation.type
        input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[CVAT_EXPORT_FORMAT_MAPPING[task_type]]
        resulting_format = DM_DATASET_FORMAT_MAPPING[task_type]

        dataset = dm.Dataset.import_from(input_dir, input_format)

        if ann_descriptor.filename == self.merged_annotation.filename:
            remove_duplicated_gt_frames(
                dataset,
                known_frames=[image.filename for image in self.project_images],
            )

        dataset.export(output_dir, resulting_format, save_images=False)


class _LabelsTaskProcessor(_TaskProcessor):
    pass


class _BoxesTaskProcessor(_TaskProcessor):
    pass


class _PointsTaskProcessor(_TaskProcessor):
    def _process_annotation_file(
        self, ann_descriptor: FileDescriptor, input_dir: str, output_dir: str
    ):
        # We need to convert point arrays, which cannot be represented in COCO directly,
        # into the 1-point skeletons, compatible with COCO person keypoints, which is the
        # required output format
        task_type = self.manifest.annotation.type
        input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[CVAT_EXPORT_FORMAT_MAPPING[task_type]]
        resulting_format = DM_DATASET_FORMAT_MAPPING[task_type]

        fix_cvat_annotations(input_dir)
        dataset = dm.Dataset.import_from(input_dir, input_format)

        converted_dataset = convert_point_arrays_dataset_to_1_point_skeletons(
            dataset,
            labels=[label.name for label in self.manifest.annotation.labels],
        )

        if ann_descriptor.filename == self.merged_annotation.filename:
            remove_duplicated_gt_frames(
                converted_dataset,
                known_frames=[image.filename for image in self.project_images],
            )

        converted_dataset.export(output_dir, resulting_format, save_images=False)


class _BoxesFromPointsTaskProcessor(_TaskProcessor):
    def __init__(self, *args, **kwargs):
        from src.handlers.job_creation import BoxesFromPointsTaskBuilder

        super().__init__(*args, **kwargs)

        roi_filenames, roi_infos, points_dataset = self._download_task_metadata()

        self.points_dataset = points_dataset
        self.original_key_to_sample = {sample.attributes["id"]: sample for sample in points_dataset}

        roi_info_by_id = {roi_info.point_id: roi_info for roi_info in roi_infos}

        self.roi_name_to_roi_id: Dict[str, BoxesFromPointsTaskBuilder.RoiInfo] = {
            os.path.splitext(roi_filename)[0]: roi_info_by_id[roi_id]
            for roi_id, roi_filename in roi_filenames.items()
        }

    def _download_task_metadata(self):
        # TODO: refactor, move to domain/core
        from src.handlers.job_creation import BoxesFromPointsTaskBuilder
        from src.services.cloud import make_client as make_storage_client

        layout = BoxesFromPointsTaskBuilder.TaskMetaLayout()
        serializer = BoxesFromPointsTaskBuilder.TaskMetaSerializer()

        oracle_data_bucket = BucketAccessInfo.from_raw_url(Config.storage_config.bucket_url())
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        storage_client = make_storage_client(oracle_data_bucket)

        roi_filenames = serializer.parse_roi_filenames(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_FILENAMES_FILENAME
                ),
            )
        )

        rois = serializer.parse_roi_info(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.ROI_INFO_FILENAME
                ),
            )
        )

        points_dataset = serializer.parse_points_annotations(
            storage_client.download_file(
                oracle_data_bucket.url.bucket_name,
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, layout.POINTS_FILENAME
                ),
            )
        )

        return roi_filenames, rois, points_dataset

    @staticmethod
    def _shift_ann(
        ann: dm.Annotation, offset_x: float, offset_y: float, img_w: int, img_h: int
    ) -> dm.Annotation:
        if isinstance(ann, dm.Bbox):
            shifted_ann = ann.wrap(
                x=offset_x + ann.x,
                y=offset_y + ann.y,
            )
        elif isinstance(ann, dm.Points):
            shifted_ann = ann.wrap(
                points=np.clip(
                    np.reshape(ann.points, (-1, 2)) + (offset_x, offset_y),
                    0,
                    [img_w, img_h],
                ).flat
            )
        elif isinstance(ann, dm.Skeleton):
            shifted_ann = ann.wrap(
                elements=[
                    point.wrap(
                        points=np.clip(
                            np.reshape(point.points, (-1, 2)) + (offset_x, offset_y),
                            0,
                            [img_w, img_h],
                        ).flat
                    )
                    for point in ann.elements
                ]
            )
        else:
            assert False, f"Unsupported annotation type '{ann.type}'"

        return shifted_ann

    def _process_annotation_file(
        self, ann_descriptor: FileDescriptor, input_dir: str, output_dir: str
    ):
        task_type = self.manifest.annotation.type
        input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[CVAT_EXPORT_FORMAT_MAPPING[task_type]]
        resulting_format = DM_DATASET_FORMAT_MAPPING[task_type]

        roi_dataset = dm.Dataset.import_from(input_dir, input_format)

        if ann_descriptor.filename == self.merged_annotation.filename:
            remove_duplicated_gt_frames(
                roi_dataset,
                known_frames=[image.filename for image in self.project_images],
            )

        merged_dataset = dm.Dataset(
            media_type=dm.Image,
            categories={
                dm.AnnotationType.label: dm.LabelCategories.from_iterable(
                    [label.name for label in self.manifest.annotation.labels]
                )
            },
        )

        for roi_sample in roi_dataset:
            roi_info = self.roi_name_to_roi_id[os.path.basename(roi_sample.id)]

            original_sample = self.original_key_to_sample[roi_info.original_image_key]
            image_h, image_w = original_sample.image.size

            merged_sample = merged_dataset.get(original_sample.id)
            if not merged_sample:
                merged_sample = original_sample.wrap(annotations=[])
                merged_dataset.put(merged_sample)

            old_point = next(
                skeleton
                for skeleton in original_sample.annotations
                if skeleton.id == roi_info.point_id
            ).elements[0]
            old_x, old_y = old_point.points[:2]

            merged_sample.annotations.extend(
                self._shift_ann(
                    roi_ann,
                    offset_x=old_x - roi_info.point_x,
                    offset_y=old_y - roi_info.point_y,
                    img_w=image_w,
                    img_h=image_h,
                )
                for roi_ann in roi_sample.annotations
                if isinstance(roi_ann, dm.Bbox)
            )

        merged_dataset.export(output_dir, resulting_format, save_images=False)


def postprocess_annotations(
    escrow_address: str,
    chain_id: int,
    annotations: List[FileDescriptor],
    merged_annotation: FileDescriptor,
    *,
    manifest: TaskManifest,
    project_images: List[Image],
) -> None:
    """
    Processes annotations and updates the files list inplace
    """
    # TODO: remove complete duplicates
    # TODO: restore original filenames and merge skeletons from RoIs

    processor_classes: Dict[TaskType, Type[_TaskProcessor]] = {
        TaskType.image_label_binary: _LabelsTaskProcessor,
        TaskType.image_boxes: _BoxesTaskProcessor,
        TaskType.image_points: _PointsTaskProcessor,
        TaskType.image_boxes_from_points: _BoxesFromPointsTaskProcessor,
    }

    task_type = manifest.annotation.type
    processor = processor_classes[task_type](
        escrow_address=escrow_address,
        chain_id=chain_id,
        annotations=annotations,
        merged_annotation=merged_annotation,
        manifest=manifest,
        project_images=project_images,
    )
    processor.process()
