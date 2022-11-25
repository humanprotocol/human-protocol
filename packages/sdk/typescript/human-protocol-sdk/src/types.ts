import {
  Escrow,
  EscrowFactory,
  HMToken,
} from '@human-protocol/core/typechain-types';
import { ethers } from 'ethers';

/**
 * Enum for escrow statuses.
 * @readonly
 * @enum {number}
 */
export enum EscrowStatus {
  /**
   * Escrow is launched.
   */
  Launched,
  /**
   * Escrow is funded, and waiting for the results to be submitted.
   */
  Pending,
  /**
   * Escrow is partially paid out.
   */
  Partial,
  /**
   * Escrow is fully paid.
   */
  Paid,
  /**
   * Escrow is finished..
   */
  Complete,
  /**
   * Escrow is cancelled.
   */
  Cancelled,
}

/**
 * Payout item
 * @readonly
 */
export type Payout = {
  /**
   * Payout address
   */
  address: string;
  /**
   * Payout amount
   */
  amount: number;
};

/**
 * Job mode
 */
export type JobMode = 'batch' | 'online' | 'instance_delivery';

/**
 * Base job types
 */
export type BaseJobTypes =
  | 'image_label_binary'
  | 'image_label_multiple_choice'
  | 'text_free_entry'
  | 'text_multiple_choice_one_option'
  | 'text_multiple_choice_multiple_options'
  | 'image_label_area_adjust'
  | 'image_label_area_select'
  | 'image_label_single_polygon'
  | 'image_label_multiple_polygons'
  | 'image_label_semantic_segmentation_one_option'
  | 'image_label_semantic_segmentation_multiple_options'
  | 'image_label_text';

/**
 * Shape type of request config
 */
export type ShapeType = 'point' | 'bounding_box' | 'polygon';

/**
 * Request config item
 */
export type RequestConfig = {
  /**
   * Version
   */
  version?: number;
  /**
   * Shape type
   */
  shape_type?: ShapeType;
  /**
   * Minimum points
   */
  min_points?: number;
  /**
   * Maximum points
   */
  max_points?: number;
  /**
   * Minimum shapes per image
   */
  min_shapes_per_image?: number;
  /**
   * Maximum shapes per image
   */
  max_shapes_per_image?: number;
  /**
   * Restrict to coordinates
   */
  restrict_to_coords?: boolean;
  /**
   * Minimum selection area per shape
   */
  minimum_selection_area_per_shape?: number;
  /**
   * Maximum choices for multiple choice
   */
  multiple_choice_max_choices?: number;
  /**
   * Minimum choices for multiple choice
   */
  multiple_choice_min_choices?: number;
};

/**
 * Webhook item
 */
export type Webhook = {
  /**
   * Webhook id
   */
  webhook_id: string;
  /**
   * Completed chunks
   */
  chunk_completed?: string[];
  /**
   * Completed jobs
   */
  job_completed?: string[];
};

/**
 * Task data item
 */
export type TaskData = {
  /**
   * Task key
   */
  task_key: string;
  /**
   * Datapoint URI
   */
  datapoint_uri: string;
  /**
   * Datapoint hash
   */
  datapoint_hash: string;
};

/**
 * Internal config item
 */
export type InternalConfig = {
  /**
   * Exchange Oracle
   */
  exchange?: Record<string, string | number>;
  /**
   * Recording Oracle
   */
  reco?: Record<string, string | number>;
  /**
   * Reputation Oracle
   */
  repo?: Record<string, string | number>;
  /**
   * Other trusted handlers
   */
  other?: Record<string, string | number>;
  /**
   * MITL???
   */
  mitl?: string | number | Record<string, string | number>;
};

/**
 * Score item
 */
export type Score = {
  /**
   * Score
   */
  score: number;
};

/**
 * Restricted audience item
 */
export type RestrictedAudience = {
  /**
   * Lang score
   */
  lang?: Score[];
  /**
   * Country score
   */
  country?: Score[];
  /**
   * Browser score
   */
  browser?: Score[];
  /**
   * Sitekey Score
   */
  sitekey?: Score[];
  /**
   * Server domain score
   */
  serverdomain?: Score[];
  /**
   * Confidence score
   */
  confidence?: Score[];

  /**
   * Minimum difficulty
   */
  min_difficulty?: number;
  /**
   * Minimum user score
   */
  min_user_score?: number;
  /**
   * Maximum user score
   */
  max_user_score?: number;

  /**
   * Launch group ID
   */
  launch_group_id?: number;
};

/**
 * Nested manifest item
 */
export type NestedManifest = Pick<
  Manifest,
  | 'job_id'
  | 'requester_restricted_answer_set'
  | 'requester_description'
  | 'requester_max_repeats'
  | 'requester_min_repeats'
  | 'requester_question'
  | 'requester_question_example'
  | 'unsafe_content'
  | 'requester_accuracy_target'
  | 'request_type'
  | 'request_config'
  | 'groundtruth_uri'
  | 'groundtruth'
  | 'confcalc_configuration_id'
  | 'webhook'
>;

/**
 * Manifest item
 * @readonly
 * @todo Confirm data type
 */
export type Manifest = {
  /**
   * Job Mode
   */
  job_mode: JobMode;
  /**
   * Job API Key
   */
  job_api_key?: string;
  /**
   * Job ID
   */
  job_id?: string;
  /**
   * Total tasks in the job
   */
  job_total_tasks: number;
  /**
   * Requester's restricted answer set
   */
  requester_restricted_answer_set?: Record<string, Record<string, string>>;
  /**
   * Requester's description
   */
  requester_description?: string;
  /**
   * Maximum repeat count of the requester
   */
  requester_max_repeats?: number;
  /**
   * Minimum repeat count of the requester
   */
  requester_min_repeats?: number;
  /**
   * Requester's question
   */
  requester_question?: Record<string, string>;
  /**
   * Requester's question example
   */
  requester_question_example?: string | string[];
  /**
   * Flag for unsafe content
   */
  unsafe_content?: boolean;
  /**
   * Bid price for the task
   */
  task_bid_price: number;
  /**
   * Staking amount for oracles
   */
  oracle_stake: number;
  /**
   * Job expiration date
   */
  expiration_date?: number;
  /**
   * Requester's accuracy target
   */
  requester_accuracy_target?: number;
  /**
   * Smart bounty address
   */
  manifest_smart_bounty_addr?: string;
  /**
   * HMT token address
   */
  hmtoken_addr?: string;
  /**
   * Minimum trust of the server
   */
  minimum_trust_server?: number;
  /**
   * Minimum trust of the client
   */
  minimum_trust_client?: number;
  /**
   * Recording oracle address
   */
  recording_oracle_addr: string;
  /**
   * Reputation oracle address
   */
  reputation_oracle_addr: string;
  /**
   * Reputation agent address
   */
  reputation_agent_addr: string;
  /**
   * Requester's PGP public key
   */
  requester_pgp_public_key?: string;
  /**
   * RO URI
   */
  ro_uri?: string;
  /**
   * Repo URI
   */
  repo_uri?: string;

  /**
   * Batch result delivery webhook
   */
  batch_result_delivery_webhook?: string;
  /**
   * Online result delivery webhook
   */
  online_result_delivery_webhook?: string;
  /**
   * Instant result delivery webhook
   */
  instant_result_delivery_webhook?: string;

  /**
   * Multi challenge manifests
   */
  multi_challenge_manifests?: NestedManifest[];

  /**
   * Request type
   */
  request_type: BaseJobTypes | 'multi_challenge';

  /**
   * Request config
   */
  request_config?: RequestConfig;

  /**
   * Task data
   */
  taskdata?: TaskData[];

  /**
   * Task data URI for external task
   */
  taskdata_uri?: string;

  /**
   * Groundtruth URI
   * Groundtruth data is stored as a URL or optionally as an inline json-serialized string
   */
  groundtruth_uri?: string;
  /**
   * Groundtruth
   */
  groundtruth?: string;

  /**
   * Rejected URI
   */
  rejected_uri?: string;
  /**
   * Rejected count
   */
  rejected_count?: number;

  /**
   * Internal config
   */
  internal_config?: InternalConfig;

  /**
   * Confcalc configuratoin ID
   */
  confcalc_configuration_id?: string;

  /**
   * Restricted audience
   */
  restricted_audience?: RestrictedAudience;

  /**
   * Webhook
   */
  webhook?: Webhook;
};

/**
 * Cloud storage object link
 * @readonly
 */
export type StorageObjectLink = {
  /**
   * Storage object URL
   */
  url: string;
  /**
   * Storage object content hash
   */
  hash: string;
};

/**
 * Ethers provider data
 * @readonly
 */
export type ProviderData = {
  /**
   * Ethers provider
   */
  provider: ethers.providers.BaseProvider;
  /**
   * Gas payer wallet
   */
  gasPayer?: ethers.Wallet;
  /**
   * Reputation oracle wallet
   */
  reputationOracle?: ethers.Wallet;
  /**
   * Other trusted handlers for the job
   */
  trustedHandlers?: Array<ethers.Wallet>;
};

/**
 * AWS/GCP cloud storage access data
 * @readonly
 */
export type StorageAccessData = {
  /**
   * Access Key ID
   */
  accessKeyId: string;
  /**
   * Secret Access Key
   */
  secretAccessKey: string;
  /**
   * Region
   */
  region?: string;
  /**
   * Request endpoint
   */
  endpoint?: string;
  /**
   * Storage bucket (private)
   */
  bucket: string;
  /**
   * Storage bucket (public)
   */
  publicBucket: string;
};

/**
 * Manifest data
 */
export type ManifestData = {
  /**
   * Manifest
   */
  manifest?: Manifest;
  /**
   * Manifest link
   */
  manifestlink?: StorageObjectLink;
  /**
   * Intermediate result link
   */
  intermediateResultLink?: StorageObjectLink;
};

/**
 * Contract data
 */
export type ContractData = {
  /**
   * Factory contract address
   */
  factoryAddr?: string;
  /**
   * Factory contract instance
   */
  factory?: EscrowFactory;
  /**
   * Escrow contract address
   */
  escrowAddr?: string;
  /**
   * Escrow contract instance
   */
  escrow?: Escrow;
  /**
   * HMToken contract address
   */
  hmTokenAddr: string;
  /**
   * HMToken contract instance
   */
  hmToken?: HMToken;
};

/**
 * Generic result data
 * @readonly
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Result = Record<string, any>;

/**
 * Upload result data
 * @readonly
 */
export type UploadResult = {
  /**
   * Uploaded object key
   */
  key: string;
  /**
   * Hash of uploaded object key
   */
  hash: string;
};

/**
 * Job arguments
 * @readonly
 */
export type JobArguments = {
  /**
   * Network
   */
  network?: string;
  /**
   * Infura project id
   */
  infuraKey?: string;
  /**
   * Alchemy API token
   */
  alchemyKey?: string;
  /**
   * Gas payer wallet / private key
   */
  gasPayer: ethers.Wallet | string;
  /**
   * Reputation oracle wallet / private key
   */
  reputationOracle: ethers.Wallet | string;
  /**
   * Trusted handlers wallet / private key
   */
  trustedHandlers?: Array<ethers.Wallet | string>;
  /**
   * HMToken address
   */
  hmTokenAddr: string;
  /**
   * Factory contract address
   */
  factoryAddr?: string;
  /**
   * Escrow contract address
   */
  escrowAddr?: string;
  /**
   * Job manifest
   */
  manifest?: Manifest;
  /**
   * AWS/GCP Access Key ID
   */
  storageAccessKeyId?: string;
  /**
   * AWS/GCP Secret Access Key
   */
  storageSecretAccessKey?: string;
  /**
   * AWS/GCP bucket endpoint
   */
  storageEndpoint?: string;
  /**
   * AWS/GCP public bucket name
   */
  storagePublicBucket?: string;
  /**
   * AWS/GCP private bucket name
   */
  storageBucket?: string;
};
