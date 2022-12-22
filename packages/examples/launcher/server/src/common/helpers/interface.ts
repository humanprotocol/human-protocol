import { IGroundTruthDataAnnotation, IGroundTruthDataImage } from "../../job/interfaces";

export function isAnGroundTruthDataImage(data: IGroundTruthDataImage): data is IGroundTruthDataImage {
  return 'id' in data && 'img_url' in data && 'file_name' in data;
}

export function isAnGroundTruthDataAnnotations(data: IGroundTruthDataAnnotation): data is IGroundTruthDataAnnotation {
  return 'id' in data && 'imgage_id' in data && 'annotator_email' in data && 'label' in data && 'segmentation_url' in data && 'bbox' in data;
}