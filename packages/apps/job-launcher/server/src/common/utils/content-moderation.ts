import { ModerationResultDto } from '../../modules/content-moderation/content-moderation.dto';

export function checkModerationLevels(
  result: ModerationResultDto,
  levels: string[],
): boolean {
  return [
    result.adult,
    result.racy,
    result.violence,
    result.spoof,
    result.medical,
  ].some((level) => levels.includes(level));
}

export function getFileName(...parts: string[]): string {
  const fullPath = parts.join('-');

  return fullPath;
}
