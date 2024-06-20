export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getFileNameFromURL(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}
