export enum JobStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  LAUNCHED = 'LAUNCHED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TO_CANCEL = 'TO_CANCEL',
  CANCELED = 'CANCELED',
}

export enum JobStatusFilter {
  PENDING = 'PENDING',
  LAUNCHED = 'LAUNCHED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum JobRequestType {
  IMAGE_POINTS = 'IMAGE_POINTS',
  IMAGE_BOXES = 'IMAGE_BOXES',
  HCAPTCHA = 'HCAPTCHA',
  FORTUNE = 'FORTUNE',
}

export enum JobCaptchaMode {
  BATCH = 'batch'
}

export enum JobCaptchaRequestType {
  IMAGE_LABEL_BINARY = 'image_label_binary',
  IMAGE_LABEL_MULTIPLE_CHOICE  = 'image_label_multiple_choice',
  IMAGE_LABEL_AREA_SELECT = 'image_label_area_select',
  TEXT_FREEE_NTRY = 'text_free_entry',
}

export enum JobCaptchaShapeType {
  POLYGON = 'polygon',
  CATEGORAZATION = 'categorization',
  POINT = 'point',
  BOUNDING_BOX = 'bounding_box',
  COMPARISON = 'comparison',
}

export enum WorkerLanguage {
  ENGLISH = 'en',
}

export enum WorkerLocation {
  GERMANY = 'DE',
  FRANCE = 'FR'
}

export enum WorkerBrowser {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  MODERN_BROWSER = 'modern_browser'
}