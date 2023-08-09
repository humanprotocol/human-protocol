import { JobRequestType } from "../src/common/enums/job";
import { IManifest } from "../src/common/interfaces/job";

export const MOCK_HOST = "127.0.0.1";
export const MOCK_PORT = 5000;
export const MOCK_WEB3_PRIVATE_KEY = "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
export const MOCK_REQUESTER_TITLE = "Mock job title";
export const MOCK_REQUESTER_DESCRIPTION = "Mock job description";
export const MOCK_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MOCK_FILE_URL = "mockedFileUrl";
export const MOCK_FILE_HASH = "mockedFileHash";
export const MOCK_FILE_KEY = "manifest.json";
export const MOCK_REPUTATION_ORACLE_WEBHOOK_URL = "http://localhost:3000";
export const MOCK_S3_ENDPOINT = "localhost";
export const MOCK_S3_PORT = 9000;
export const MOCK_S3_ACCESS_KEY = "access_key";
export const MOCK_S3_SECRET_KEY = "secret_key";
export const MOCK_S3_BUCKET = "solution";
export const MOCK_S3_USE_SSL = false;
export const MOCK_MANIFEST: IManifest = {
  submissionsRequired: 2,
  requesterTitle: "Fortune",
  requesterDescription: "Some desc",
  fundAmount: "8",
  requestType: JobRequestType.FORTUNE,
};
