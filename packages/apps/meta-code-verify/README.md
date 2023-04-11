# Video Demo

[Video Demo](https://www.youtube.com/watch?v=BZfnLPGep-4)

# Description

This project is a modified version of [meta-code-verify](https://github.com/facebookincubator/meta-code-verify) by Facebook. In simple terms, it's a web extension for checking if the JavaScript hasn't been tampered with by creating a Merkle tree both on the client and server side. You can read more about this concept on the [Mozilla Wiki](https://wiki.mozilla.org/Security/Binary_Transparency). The code pushed to the repository includes a [script](https://github.com/spiritbroski/human-protocol/blob/24b39697a51096c9f982b00b44a469b0c11470de/packages/apps/escrow-dashboard/scripts/generateMerkleTree.ts) to generate a Merkle tree in Vite, and then push the root of the Merkle tree to IPFS. The design is inspired by the WhatsApp binary transparency manifest:

![WhatsApp Binary Transparency Manifest](https://user-images.githubusercontent.com/62529025/228214669-6cc7446d-e2b1-455f-af94-ebd8f60aba80.png)

Here's what it looks like in our apps:

![App Screenshot](https://user-images.githubusercontent.com/62529025/228215108-8891f6dc-23f3-4fa8-9188-c780707c50c0.png)

The main difference is the removal of `version` and `hash_function`, replaced by `ipfs_cid`, which can later be used to verify the Merkle tree. While WhatsApp pushes their Merkle root to Cloudflare, our implementation is more resilient as it's decentralized in IPFS, in contrast to the centralized server solution used by Cloudflare. The following is a brief description of the project and how to use it.

# How to Use

As this is a web extension, you'll need to have either a Chrome-based browser or Firefox. In this demo, we use Brave browser. First, navigate to `packages/apps/meta-code-verify` and run this script:

```bash
$ yarn
$ yarn build-local-dev
```

Then, go to your browser and open this URL: `brave://extensions/` Turn on developer mode if you haven't:

![Developer mode](https://user-images.githubusercontent.com/62529025/228216854-1e85b3c3-3f13-441f-82c3-ed188dffeed6.png)

Click "Load Unpacked":

![Load unpacked](https://user-images.githubusercontent.com/62529025/228217073-da947a33-e591-48a4-b283-29b258c5128c.png)

Navigate to the `dist/chrome` folder of meta-code-verify, then click "Select Folder":

![Navigate](https://user-images.githubusercontent.com/62529025/228217002-c866ff59-2f32-4c7d-9596-af88e98e0e2b.png)

If successful, it will show something like this:

![Success](https://user-images.githubusercontent.com/62529025/228217415-034622c6-0cf6-46c2-9d58-237ca72d8bf5.png)

Now, go to `packages/apps/escrow-dashboard` and then add the necessary environment variable:

```
VITE_APP_NFT_STORAGE_API=
```

And then run this command:

```
$ yarn
$ yarn build --mode development
```

Wait until it finishes building, then run:

```
$ yarn start-prod
```

Go to your browser and navigate to `http://localhost:3000` If you click on the web extension icon, you'll see a green checkmark, indicating that our code is not tampered with:

![Not tampered](https://user-images.githubusercontent.com/62529025/228218083-ea324fe9-fb45-46be-80dc-3ed6a712d983.png)

To test if our code is getting tampered with, first, stop the `yarn start-prod` command (use CTRL+C on Linux). Then, go to `index.html` in the `packages/apps/escrow-dashboard` and add `<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>`:

![Script added](https://user-images.githubusercontent.com/62529025/228218787-69c76cbe-fef1-42eb-b917-5fc5c2959048.png)

Run `yarn build --mode development` again, followed by `yarn start-prod`. When you go to `http://localhost:3000` again, you'll see a red exclamation mark:

![Red exclamation](https://user-images.githubusercontent.com/62529025/228222259-d144fd17-0f7d-4a2b-93ff-caf57ae31ced.png)

This indicates that one or more scripts are not in the Merkle tree. If you download it, you'll get a list of all JavaScript files and their source code in gzip files, so you can check it yourself. 