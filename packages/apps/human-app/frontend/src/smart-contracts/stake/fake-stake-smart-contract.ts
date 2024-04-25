// TODO remove when actual smart contract will be integrated

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class FakeSmartContract {
  private static instance: FakeSmartContract;
  private stack: number;

  private constructor() {
    this.stack = 100;
  }

  public static getInstance(): FakeSmartContract {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- can be ignored
    if (!FakeSmartContract.instance) {
      FakeSmartContract.instance = new FakeSmartContract();
    }
    return FakeSmartContract.instance;
  }

  public async setStack(value: number): Promise<void> {
    await delay(1000);
    this.stack += value;
  }

  public async getStack(): Promise<number> {
    await delay(1000);
    return this.stack;
  }
}
