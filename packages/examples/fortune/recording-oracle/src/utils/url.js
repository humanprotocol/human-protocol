function convertUrl(url) {
  if (process.env.DOCKER) {
    return url.replace('localhost', 'host.docker.internal');
  }
  return url;
}

module.exports = convertUrl;
