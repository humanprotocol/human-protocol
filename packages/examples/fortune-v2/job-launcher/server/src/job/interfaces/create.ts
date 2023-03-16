export interface IJobFortuneCreateDto {
  fortunesRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  price: number;
}

export interface IJobCvatCreateDto {
  dataUrl: string;
  annotationsPerImage: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
}