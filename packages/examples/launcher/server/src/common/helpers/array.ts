export function min(nums: number[]): number {
  return Math.min(...nums)
}

export function max(nums: number[]): number {
  return Math.max(...nums)
}

export function avg(nums: number[]): number {
  return nums.reduce( ( p, c ) => p + c, 0 ) / nums.length;
}

