import { FC } from 'react';

import {
  EscrowDetail,
  Faucet,
  Kvstore,
  LeaderDetail,
  // Leaderboard,
  Main,
  Owner,
  Profile,
  MyHMT,
  ConfigureOracle,
  HowToHuman,
} from 'src/pages';

interface Route {
  key: string;
  title: string;
  path: string;
  component: FC;
}

export const routes: Array<Route> = [
  {
    key: 'main-route',
    title: 'Main',
    path: '/',
    component: Main,
  },
  // {
  //   key: 'leaderboard-route',
  //   title: 'Leaderboard',
  //   path: '/leaderboard',
  //   component: Leaderboard,
  // },
  {
    key: 'leader-detail-route',
    title: 'Leader',
    path: '/leader/:chainId/:address',
    component: LeaderDetail,
  },
  {
    key: 'escrow-detail-route',
    title: 'Escrow',
    path: '/escrow/:chainId/:address',
    component: EscrowDetail,
  },
  {
    key: 'profile-route',
    title: 'Profile',
    path: '/profile',
    component: Profile,
  },
  {
    key: 'owner-route',
    title: 'owner',
    path: '/owner',
    component: Owner,
  },
  {
    key: 'kvstore-route',
    title: 'KV Store',
    path: '/kvstore',
    component: Kvstore,
  },
  {
    key: 'faucet-route',
    title: 'Faucet',
    path: '/faucet',
    component: Faucet,
  },
  {
    key: 'my-hmt-route',
    title: 'My HMT',
    path: '/my-hmt',
    component: MyHMT,
  },
  {
    key: 'configure-oracle-route',
    title: 'Configure Oracle',
    path: '/configure-oracle',
    component: ConfigureOracle,
  },
  {
    key: 'how-to-human',
    title: 'How To HUMAN',
    path: '/how-to-human',
    component: HowToHuman,
  },
];
