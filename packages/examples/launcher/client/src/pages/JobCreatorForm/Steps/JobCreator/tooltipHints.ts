export enum Title {
  Price = 'Job cost paid to workers. This parameter will be recommended to the user based on the selected price recommendation algorithm',
  DataUrl = 'Link to the S3 bucket that stores the images for the annotation',
  RequesterDescription = 'How dataset should be annotated',
  AnnotationsPerImage = 'Number of annotations (workers) for one image in CVAT',
  RequesterAccuracyTarget = 'Accuracy required for the annotation of each image',
  Labels = 'List of image labels',
  // TransactionHash = 'Transaction hash of the payment made to the requesters before the job was created. The job will not be created if the transaction hash is not valid. The hash is valid if the number of sent tokens matches the price of the job, the number of transaction confirmations is greater than the specified number',
  // RequesterQuestion = 'Requester Question',
  // RequesterQuestionExample = 'Requester Question Example',
}
