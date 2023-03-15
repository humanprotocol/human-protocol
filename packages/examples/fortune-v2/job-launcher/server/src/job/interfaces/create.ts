export interface IJobCreateDto {
  dataUrl: string;
  groundTruthFileUrl: string;
  annotationsPerImage: number;
  labels: string[];
  requesterDescription: string;
  requesterAccuracyTarget: number;
  price: number;
  fee: number;
}
