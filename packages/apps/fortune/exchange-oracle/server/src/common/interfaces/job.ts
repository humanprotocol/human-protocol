export interface ISolution {
  workerAddress: string;
  solution: string;
  invalid?: boolean;
}

export interface ISolutionsFile {
  exchangeAddress: string;
  solutions: ISolution[];
}
