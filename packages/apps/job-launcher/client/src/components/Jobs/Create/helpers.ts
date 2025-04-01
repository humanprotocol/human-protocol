import {
  JobRequest,
  Qualification,
  CvatJobType,
  StorageProviders,
  GCSRegions,
  AWSRegions,
} from '../../../types';

export const mapCvatFormValues = (
  jobRequest: JobRequest,
  qualificationsOptions: Qualification[],
) => {
  const { cvatRequest } = jobRequest;
  return {
    labels: cvatRequest?.labels?.map((label) => label.name) || [],
    nodes: cvatRequest?.labels?.[0]?.nodes || [],
    type: cvatRequest?.type || CvatJobType.IMAGE_BOXES,
    description: cvatRequest?.description || '',
    qualifications: cvatRequest?.qualifications
      ? qualificationsOptions.filter((q: Qualification) =>
          cvatRequest?.qualifications?.includes(q.reference),
        )
      : [],
    userGuide: cvatRequest?.userGuide || '',
    accuracyTarget: cvatRequest?.accuracyTarget || 80,
    dataProvider: cvatRequest?.data?.dataset?.provider || StorageProviders.AWS,
    dataRegion:
      (cvatRequest?.data?.dataset?.region as AWSRegions | GCSRegions) || '',
    dataBucketName: cvatRequest?.data?.dataset?.bucketName || '',
    dataPath: cvatRequest?.data?.dataset?.path || '',
    bpProvider:
      cvatRequest?.data?.points?.provider ||
      cvatRequest?.data?.boxes?.provider ||
      StorageProviders.AWS,
    bpRegion:
      cvatRequest?.data?.points?.region ||
      (cvatRequest?.data?.boxes?.region as AWSRegions | GCSRegions) ||
      '',
    bpBucketName:
      cvatRequest?.data?.points?.bucketName ||
      cvatRequest?.data?.boxes?.bucketName ||
      '',
    bpPath:
      cvatRequest?.data?.points?.path || cvatRequest?.data?.boxes?.path || '',
    gtProvider: cvatRequest?.groundTruth?.provider || StorageProviders.AWS,
    gtRegion:
      (cvatRequest?.groundTruth?.region as AWSRegions | GCSRegions) || '',
    gtBucketName: cvatRequest?.groundTruth?.bucketName || '',
    gtPath: cvatRequest?.groundTruth?.path || '',
  };
};

export const mapFortuneFormValues = (
  jobRequest: JobRequest,
  qualificationsOptions: Qualification[],
) => {
  const { fortuneRequest } = jobRequest;
  return {
    title: fortuneRequest?.title || '',
    fortunesRequested: fortuneRequest?.fortunesRequested || 0,
    description: fortuneRequest?.description || '',
    qualifications: fortuneRequest?.qualifications
      ? qualificationsOptions.filter((q: Qualification) =>
          fortuneRequest?.qualifications?.includes(q.reference),
        )
      : [],
  };
};
