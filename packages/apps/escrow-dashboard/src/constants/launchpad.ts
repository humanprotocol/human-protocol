import imageBinaryImg from '../assets/launchpad/task-types/image_binary.png';
import imageBoundingBoxImg from '../assets/launchpad/task-types/image_bounding_box.png';
import imageMultipleChoiceImg from '../assets/launchpad/task-types/image_multiple_choice.png';
import imageRedoBBImg from '../assets/launchpad/task-types/image_redo_bb.png';
import imageSemanticSegmentationImg from '../assets/launchpad/task-types/image_semantic_segmentation.png';
import marketMakingHuFiImg from '../assets/launchpad/task-types/market_making_hufi.png';
import openQueriesMarketResearchImg from '../assets/launchpad/task-types/open_queries_market_research.png';
import textFreeEntryOcrImg from '../assets/launchpad/task-types/text_free_entry_ocr.png';
import textMultipleChoiceImg from '../assets/launchpad/task-types/text_multiple_choice.png';

export enum TextLabelingJobType {
  FREE_ENTRY_OCR = 'FREE_ENTRY_OCR',
  MULTIPLE_CHOICE = 'TEXT_MULTIPLE_CHOICE',
}

export enum ImageLabelingJobType {
  BINARY = 'BINARY',
  BOUNDING_BOX = 'BOUNDING_BOX',
  REDO_BB = 'REDO_BB',
  MULTIPLE_CHOICE = 'IMAGE_MULTIPLE_CHOICE',
  SEMANTIC_SEGMENTATION = 'SEMANTIC_SEGMENTATION',
}

export enum MarketMakingJobType {
  HUFI = 'HUFI',
}

export enum OpenQueriesJobType {
  MARKET_RESEARCH = 'MARKET_RESEARCH',
}

export const TextLabelingJobTypeData = {
  [TextLabelingJobType.FREE_ENTRY_OCR]: {
    label: 'Text free entry/OCR',
    description:
      'Type the words shown (with image) or just text. Name an object that tells time.',
    image: textFreeEntryOcrImg,
  },
  [TextLabelingJobType.MULTIPLE_CHOICE]: {
    label: 'Multiple Choice',
    description: 'Click the closest match to the words shown.',
    image: textMultipleChoiceImg,
  },
};

export const ImageLabelingJobTypeData = {
  [ImageLabelingJobType.BINARY]: {
    label: 'Binary',
    description: 'Click all the cats.',
    image: imageBinaryImg,
  },
  [ImageLabelingJobType.BOUNDING_BOX]: {
    label: 'Bounding box',
    description: 'Click the face or draw a box on the face.',
    image: imageBoundingBoxImg,
  },
  [ImageLabelingJobType.REDO_BB]: {
    label: 'Redo BB',
    description: 'Reposition this box to better enclose the face.',
    image: imageRedoBBImg,
  },
  [ImageLabelingJobType.MULTIPLE_CHOICE]: {
    label: 'Multiple Choice',
    description: 'Click all the words that apply to this image.',
    image: imageMultipleChoiceImg,
  },
  [ImageLabelingJobType.SEMANTIC_SEGMENTATION]: {
    label: 'Semantic segmentation',
    description:
      'Paint the areas of the image that correspond to this subject.',
    image: imageSemanticSegmentationImg,
  },
};

export const MarketMakingJobTypeData = {
  [MarketMakingJobType.HUFI]: {
    label: 'HuFi',
    description:
      'Launch campaigns, choose trading pairs, and select exchange platforms.',
    image: marketMakingHuFiImg,
  },
};

export const OpenQueriesJobTypeData = {
  [OpenQueriesJobType.MARKET_RESEARCH]: {
    label: 'Market research',
    description:
      'Open queries with an open text answer box. Query can contain a link.',
    image: openQueriesMarketResearchImg,
  },
};
