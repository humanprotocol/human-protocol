import { CvatJobType, JobRequestType } from '../../common/enums/job';
import {
  CvatDataDto,
  JobCaptchaDto,
  JobCvatDto,
  JobFortuneDto,
  StorageDataDto,
} from './job.dto';
import { JobEntity } from './job.entity';

export interface RequestAction {
  createManifest: (
    dto: JobFortuneDto | JobCvatDto | JobCaptchaDto,
    requestType: JobRequestType,
    fundAmount: number,
    decimals: number,
  ) => Promise<any>;
}

export interface ManifestAction {
  getElementsCount: (urls: GenerateUrls) => Promise<number>;
  generateUrls: (
    data: CvatDataDto,
    groundTruth: StorageDataDto,
  ) => GenerateUrls;
}

export interface EscrowAction {
  getTrustedHandlers: () => string[];
}

export interface OracleAction {
  getOracleAddresses: () => OracleAddresses;
}

export interface OracleAddresses {
  exchangeOracle: string;
  recordingOracle: string;
  reputationOracle: string;
}

export interface CvatCalculateJobBounty {
  requestType: CvatJobType;
  fundAmount: number;
  decimals: number;
  urls: GenerateUrls;
  nodesTotal?: number;
}

export interface GenerateUrls {
  dataUrl: URL;
  gtUrl: URL;
  pointsUrl?: URL;
  boxesUrl?: URL;
}

export interface CvatImageData {
  id: number;
  width: number;
  height: number;
  file_name: string;
  license: number;
  flickr_url: string;
  coco_url: string;
  date_captured: number;
}

export interface CvatAnnotationData {
  id: number;
  image_id: number;
  category_id: number;
  segmentation: number[];
  area: number;
  bbox: [number, number, number, number];
  iscrowd: number;
  attributes: {
    scale: number;
    x: number;
    y: number;
  };
  keypoints: [number, number, number];
  num_keypoints: number;
}

export interface ListResult {
  entities: JobEntity[];
  itemCount: number;
}
