export class CaseConverter {
  static convertSnakeToHumanReadable(string: string): string {
    return string
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
