export enum JobRequestType {
  IMAGE_BOXES = 'IMAGE_BOXES',
  IMAGE_POINTS = 'IMAGE_POINTS',
  IMAGE_BOXES_FROM_POINTS = 'IMAGE_BOXES_FROM_POINTS',
  IMAGE_SKELETONS_FROM_BOXES = 'IMAGE_SKELETONS_FROM_BOXES',
  FORTUNE = 'FORTUNE',
}

export enum SolutionError {
  Duplicated = 'Duplicated',
  CurseWord = 'CurseWord',
}
