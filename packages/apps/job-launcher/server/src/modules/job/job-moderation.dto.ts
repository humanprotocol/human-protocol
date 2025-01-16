export class ModerationResultDto {
  adult: string;
  violence: string;
  racy: string;
  spoof: string;
  medical: string;
}

export class ImageModerationResultDto {
  imageUrl: string;
  moderationResult: ModerationResultDto;
}

export class DataModerationResultDto {
  containsAbuse: boolean;
  veryLikelyOrLikelyResults: ImageModerationResultDto[];
  possibleResults: ImageModerationResultDto[];
}
