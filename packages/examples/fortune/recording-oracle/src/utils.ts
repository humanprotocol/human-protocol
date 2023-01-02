export function convertUrl(url: string): string {
    if (url.startsWith("http://")) {
      return url.replace("http://", "https://");
    }
    if (url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  }
  