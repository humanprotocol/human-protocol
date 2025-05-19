export function generateFutureDate(daysFromNow = 1): Date {
  /**
   * setDate will use integer part if float is passed
   * so round it here to be explicit
   */
  const _daysFromNow = Math.max(Math.floor(daysFromNow), 1);
  const currentDate = new Date();
  const futureDate = new Date();

  futureDate.setDate(currentDate.getDate() + _daysFromNow);

  return futureDate;
}
