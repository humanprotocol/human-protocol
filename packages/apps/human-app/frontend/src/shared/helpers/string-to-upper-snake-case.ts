export function stringToUpperSnakeCase(text: string): string {
  return text.toUpperCase().split(' ').join('_');
}
