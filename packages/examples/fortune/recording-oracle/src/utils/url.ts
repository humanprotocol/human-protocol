export function convertUrl(url: string) {
    if (Deno.env.get("DOCKER") ){
      return url.replace('localhost', 'host.docker.internal');
    }
  
    return url;
  }
  