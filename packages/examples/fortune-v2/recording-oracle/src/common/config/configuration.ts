export default () => ({
  server: {
    host: process.env.HOST,
    port: +(process.env.PORT || "5001"),
    sessionSecret: process.env.SESSION_SECRET,
    feUrl: process.env.FE_URL || "http://localhost:3001",
  },
  ethereum: {
    jsonRpcUrl: process.env.JSON_RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
  },
  storage: {
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    endPoint: process.env.STORAGE_ENDPOINT,
    port: +(process.env.STORAGE_PORT || "9000"),
    useSSL: process.env.STORAGE_USE_SSL === "true",
    bucket: process.env.STORAGE_BUCKET,
  },
});
