export interface IJobFortuneCreateDto {
  chainId: number;
  fortunesRequired: number;
  requesterTitle: string;
  requesterDescription: string;
  price: number;
}

export interface IJobCvatCreateDto {
  chainId: number;
  dataUrl: string;
  annotationsPerImage: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
}