import { FC } from 'react';

import { Faucet } from 'src/pages';

interface Route {
  key: string;
  title: string;
  path: string;
  component: FC;
}

export const routes: Array<Route> = [
  {
    key: 'all',
    title: 'Faucet',
    path: '*',
    component: Faucet,
  },
];
