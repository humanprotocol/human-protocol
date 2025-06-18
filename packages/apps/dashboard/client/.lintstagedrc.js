export default {
  "*.{ts,tsx}": [
    () => "tsc --skipLibCheck --noEmit", 
    "prettier --write",
    "eslint --cache --fix",
  ],
};