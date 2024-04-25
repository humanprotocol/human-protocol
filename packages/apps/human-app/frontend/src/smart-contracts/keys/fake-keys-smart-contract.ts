// TODO remove when actual smart contract will be integrated

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface PendingKeys {
  role: string;
  annotationURL: string;
  url: string;
}

export interface ExistingKeys {
  fee: number;
  webhookUrl: string;
  jobTypes: string[];
}

export class FakeSmartContract {
  private static instance: FakeSmartContract;
  private existingKey: ExistingKeys;
  private pendingKeys: PendingKeys;

  private constructor() {
    this.existingKey = {
      fee: 10,
      webhookUrl: 'https://mywebhookurl.com',
      jobTypes: ['Image Labelling', 'BBox'],
    };

    this.pendingKeys = {
      role: 'Exchange Oracle',
      annotationURL: 'https://mywebhookurl.com',
      url: 'https://mywebhookurl.com',
    };
  }

  public static getInstance(): FakeSmartContract {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be ignored
    if (!FakeSmartContract.instance) {
      FakeSmartContract.instance = new FakeSmartContract();
    }
    return FakeSmartContract.instance;
  }

  public async getPendingKeys(): Promise<PendingKeys> {
    await delay(1000);
    return this.pendingKeys;
  }

  public async getExistingKeys(): Promise<ExistingKeys> {
    await delay(1000);
    return this.existingKey;
  }

  public async editExistingKeys(newExistingKeys: ExistingKeys): Promise<void> {
    await delay(1000);
    this.existingKey = newExistingKeys;
  }
}
