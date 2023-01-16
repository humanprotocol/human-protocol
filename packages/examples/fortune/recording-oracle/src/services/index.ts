import axios from 'axios';

export async function getManifestByUrl(manifestUrl: string) {
  const response = await axios.get(manifestUrl);

  if (!response.data) {
    throw new Error("Not Found")
  }

  return response.data;
}

export async function sendFortunes(fortunes: any) {
  return { response: true };
}