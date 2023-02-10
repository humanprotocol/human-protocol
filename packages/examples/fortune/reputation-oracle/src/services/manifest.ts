import axios from 'axios';
import { convertUrl } from '../utils/url';

export async function getManifest(manifestUrl: string) {
  const manifestResponse = await axios.get(convertUrl(manifestUrl));
  return manifestResponse.data;
}

export default getManifest;
