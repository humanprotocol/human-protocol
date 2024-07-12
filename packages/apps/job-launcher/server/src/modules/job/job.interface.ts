import { JobRequestType } from '../../common/enums/job';
import { CreateJob, CvatDataDto, StorageDataDto } from './job.dto';
import { JobEntity } from './job.entity';

export interface RequestAction {
  calculateFundAmount: (dto: CreateJob, rate: number) => Promise<number>;
  createManifest: (
    dto: CreateJob,
    requestType: JobRequestType,
    fundAmount: number,
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
  requestType: JobRequestType;
  fundAmount: number;
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
