import io
import os
import zipfile
from glob import glob
from tempfile import TemporaryDirectory
from typing import Dict, List, Sequence

import datumaro as dm
from attrs import define
from defusedxml import ElementTree as ET

from src.core.annotation_meta import ANNOTATION_METAFILE_NAME, AnnotationMeta, JobMeta
from src.core.manifest import TaskManifest
from src.core.types import TaskType
from src.cvat.tasks import DM_DATASET_FORMAT_MAPPING
from src.models.cvat import Image, Job
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

CVAT_EXPORT_FORMAT_MAPPING = {
    TaskType.image_label_binary: "CVAT for images 1.1",
    TaskType.image_points: "CVAT for images 1.1",
    TaskType.image_boxes: "COCO 1.0",
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


def postprocess_annotations(
    annotations: List[FileDescriptor],
    merged_annotation: FileDescriptor,
    *,
    manifest: TaskManifest,
    project_images: List[Image],
) -> None:
    """
    Processes annotations and updates the files list inplace
    """

    task_type = manifest.annotation.type

    if task_type != TaskType.image_points:
        return  # CVAT export is fine

    # We need to convert point arrays, which cannot be represented in COCO directly,
    # into the 1-point skeletons, compatible with COCO person keypoints, which is the
    # required output format
    input_format = CVAT_EXPORT_FORMAT_TO_DM_MAPPING[CVAT_EXPORT_FORMAT_MAPPING[task_type]]
    resulting_format = DM_DATASET_FORMAT_MAPPING[task_type]

    with TemporaryDirectory() as tempdir:
        for ann_descriptor in annotations:
            if not zipfile.is_zipfile(ann_descriptor.file):
                raise ValueError("Annotation files must be zip files")
            ann_descriptor.file.seek(0)

            extract_dir = os.path.join(
                tempdir,
                os.path.splitext(os.path.basename(ann_descriptor.filename))[0],
            )
            extract_zip_archive(ann_descriptor.file, extract_dir)

            fix_cvat_annotations(extract_dir)
            dataset = dm.Dataset.import_from(extract_dir, input_format)

            converted_dataset = convert_point_arrays_dataset_to_1_point_skeletons(
                dataset,
                labels=[label.name for label in manifest.annotation.labels],
            )

            if ann_descriptor.filename == merged_annotation.filename:
                remove_duplicated_gt_frames(
                    converted_dataset,
                    known_frames=[image.filename for image in project_images],
                )

            export_dir = os.path.join(
                tempdir,
                os.path.splitext(os.path.basename(ann_descriptor.filename))[0] + "_conv",
            )
            converted_dataset.export(export_dir, resulting_format, save_images=False)

            converted_dataset_archive = io.BytesIO()
            write_dir_to_zip_archive(export_dir, converted_dataset_archive)
            converted_dataset_archive.seek(0)

            ann_descriptor.file = converted_dataset_archive
