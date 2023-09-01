import useSWR from 'swr';

export const useJobManifest = (url?: string) => {
  return useSWR(`human-protocol-job-manifest-${url}`, async () => {
    if (!url) return null;
    try {
      const manifest = await fetch(url).then((res) => res.json());
      return manifest;
    } catch (err) {
      return null;
    }
  });
};
