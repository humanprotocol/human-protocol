import { ModerationResultDto } from '../../modules/job/job-moderation.dto';

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
