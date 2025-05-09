export type VeriffCreateSessionResponse = {
  status: string;
  verification: {
    id: string;
    url: string;
  };
};
