# Fortune Exchange Oracle
This oracle allows workers to submit their fortunes.
## Deployment on Vercel
1. On Github fork this repository. (Skip this step for Human Protocol team)
2. Then go to your Vercel dashboard and click on Add New... Project.
3. Choose the forked repository or this repository if you are on Human Protocol team.
4. Give to the project a name.
5. Choose the root directory as `packages/examples/fortune/exchange`
6. In Build and Output Settings section set these values:
    - Build Command: `yarn workspace exchange build`
    - Output Directory: `build`
    - Install Command: `yarn install`
7. Set Environnment Variables:
    - REACT_APP_WALLETCONNECT_PROJECT_ID