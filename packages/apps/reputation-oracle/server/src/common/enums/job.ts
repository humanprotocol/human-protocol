export enum JobRequestType {
  IMAGE_BOXES = 'image_boxes',
  IMAGE_POINTS = 'image_points',
  IMAGE_BOXES_FROM_POINTS = 'image_boxes_from_points',
  IMAGE_SKELETONS_FROM_BOXES = 'image_skeletons_from_boxes',
  FORTUNE = 'fortune',
  IMAGE_POLYGONS = 'image_polygons',
}

export enum SolutionError {
  Duplicated = 'duplicated',
  CurseWord = 'curse_word',
}
