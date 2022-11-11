const Timeout = (time:number) => {
	let controller = new AbortController();
	setTimeout(() => controller.abort(), time * 1000);
	return controller;
};
export const generateKey = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/generate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
    signal: Timeout(10).signal
  });
  return res.json();
};

export const showIPFS = async (ipfs: string): Promise<string> => {
  const res = await fetch(`https://nftstorage.link/ipfs/${ipfs}`,{signal: Timeout(10).signal});
  if (res.ok) {
    return res.text();
  } else {
    throw new Error("Error getting ipfs data");
  }
};
