export type PageSize = 5 | 10;

export enum JobType {
  FORTUNE = 'fortune',
  POINTS = 'image_points',
  BOUNDING_BOXES = 'image_boxes',
  BOUNDING_BOXES_FROM_POINTS = 'image_boxes_from_points',
  SKELETONS_FROM_BOUNDING_BOXES = 'image_skeletons_from_boxes',
  POLYGONS = 'image_polygons',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  AUDIO_ATTRIBUTE_ANNOTATION = 'audio_attribute_annotation',
  SOCIAL_MEDIA_PROMOTION = 'social_media_promotion',
  SOCIAL_MEDIA_ENGAGEMENT = 'social_media_engagement',
}

export enum KycStatus {
  NONE = 'none',
  APPROVED = 'approved',
  RESUBMISSION_REQUESTED = 'resubmission_requested',
  DECLINED = 'declined',
  REVIEW = 'review',
  EXPIRED = 'expired',
  ABANDONED = 'abandoned',
}
