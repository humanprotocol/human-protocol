function convertUrl(url) {
  return url.replace('localhost', 'host.docker.internal');
}

module.exports = convertUrl;
