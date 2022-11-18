export function convertUrl(url: string) {
  if (process.env.DOCKER) {
    return url.replace('localhost', 'host.docker.internal');
  }
  return url;
}
