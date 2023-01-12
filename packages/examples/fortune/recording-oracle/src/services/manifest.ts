import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";
import { convertUrl } from '../utils/url.ts';

export async function getManifest(manifestUrl: string) {
  const manifestResponse = await axiod.get(convertUrl(manifestUrl));
  return manifestResponse.data;
}

export default getManifest;
