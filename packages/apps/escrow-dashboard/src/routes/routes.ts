import { FC } from 'react';
import {
  Main,
  Leaderboard,
  Kvstore,
  Leader,
  Escrow,
  Profile,
  Owner,
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
  {
    key: 'leaderboard-route',
    title: 'Leaderboard',
    path: '/leaderboard',
    component: Leaderboard,
  },
  {
    key: 'leader-detail-route',
    title: 'Leader',
    path: '/leader/:chainId/:address',
    component: Leader,
  },
  {
    key: 'escrow-detail-route',
    title: 'Escrow',
    path: '/escrow/:chainId/:address',
    component: Escrow,
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
];
