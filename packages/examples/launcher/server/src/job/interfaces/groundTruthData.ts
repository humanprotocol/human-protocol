export interface IGroundTruthData {
  images: IGroundTruthDataImage[];
  annotations: IGroundTruthDataAnnotation[]
}

export interface IGroundTruthDataImage {
  id: number;
  img_url: string;
  file_name: string;
}

export interface IGroundTruthDataAnnotation {
  id: number;
  imgage_id: number;
  annotator_email: string;
  label: string;
  segmentation_url: string;
  bbox: number[]
}