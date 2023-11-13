export enum TextLabelingJobType {
  FREE_ENTRY_OCR = 'FREE_ENTRY_OCR',
  MULTIPLE_CHOICE = 'TEXT_MULTIPLE_CHOICE',
}

export const TextLabelingJobTypeLabels = {
  [TextLabelingJobType.FREE_ENTRY_OCR]: 'Text free entry/OCR',
  [TextLabelingJobType.MULTIPLE_CHOICE]: 'Multiple Choice',
};

export enum ImageLabelingJobType {
  BINARY = 'BINARY',
  BOUNDING_BOX = 'BOUNDING_BOX',
  REDO_BB = 'REDO_BB',
  MULTIPLE_CHOICE = 'IMAGE_MULTIPLE_CHOICE',
  SEMANTIC_SEGMENTATION = 'SEMANTIC_SEGMENTATION',
}

export const ImageLabelingJobTypeLabels = {
  [ImageLabelingJobType.BINARY]: 'Binary',
  [ImageLabelingJobType.BOUNDING_BOX]: 'Bounding box',
  [ImageLabelingJobType.REDO_BB]: 'Redo BB',
  [ImageLabelingJobType.MULTIPLE_CHOICE]: 'Multiple Choice',
  [ImageLabelingJobType.SEMANTIC_SEGMENTATION]: 'Semantic segmentation',
};

export enum MarketMakingJobType {
  HUFI = 'HUFI',
}

export const MarketMakingJobTypeLabels = {
  [MarketMakingJobType.HUFI]: 'HuFi',
};

export enum OpenQueriesJobType {
  MARKET_RESEARCH = 'MARKET_RESEARCH',
}

export const OpenQueriesJobTypeLabels = {
  [OpenQueriesJobType.MARKET_RESEARCH]: 'Market research',
};
