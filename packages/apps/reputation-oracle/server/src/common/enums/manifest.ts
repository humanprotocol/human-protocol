export enum FortuneJobType {
  FORTUNE = 'fortune',
}

export enum MarketingJobType {
  SOCIAL_MEDIA_PROMOTION = 'social_media_promotion',
  SOCIAL_MEDIA_ENGAGEMENT = 'social_media_engagement',
}

export enum CvatJobType {
  IMAGE_BOXES = 'image_boxes',
  IMAGE_POINTS = 'image_points',
  IMAGE_BOXES_FROM_POINTS = 'image_boxes_from_points',
  IMAGE_SKELETONS_FROM_BOXES = 'image_skeletons_from_boxes',
  IMAGE_POLYGONS = 'image_polygons',
}

export const JobType = [
  ...Object.values(FortuneJobType),
  ...Object.values(MarketingJobType),
  ...Object.values(CvatJobType),
] as const;
