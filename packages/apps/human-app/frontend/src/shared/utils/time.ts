export type ProposalStatus = 'pending' | 'active';

export function getProposalStatus(
  voteStartMs: number,
  voteEndMs: number,
  now: number = Date.now()
): ProposalStatus {
  if (voteStartMs <= now && now < voteEndMs) return 'active';
  return 'pending';
}

export function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
