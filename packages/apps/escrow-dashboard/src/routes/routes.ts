import { FC } from 'react';
import { Main, Leaderboard, Leader, Escrow } from 'src/pages';

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
    path: '/leader/:address',
    component: Leader,
  },
  {
    key: 'escrow-detail-route',
    title: 'Escrow',
    path: '/escrow/:address',
    component: Escrow,
  },
];
