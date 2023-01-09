const Timeout = (time:number) => {
    let controller = new AbortController();
    setTimeout(() => controller.abort(), time * 1000);
    return controller;
};
export const showIPFS = async (ipfs: string): Promise<string> => {
    const res = await fetch(`https://nftstorage.link/ipfs/${ipfs}`,{signal: Timeout(10).signal});
    if (res.ok) {
        return res.text();
    } else {
        throw new Error("Error getting ipfs data");
    }
};

export const showGithubPGP = async (username: string): Promise<string> => {
    const res = await fetch(`https://api.github.com/users/${username}/gpg_keys`,{signal: Timeout(10).signal});
    if (res.ok) {
        return res.text();
    } else {
        throw new Error("Error getting github gpg data");
    }
};