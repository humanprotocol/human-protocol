import { FC } from 'react';
import { Main, Leaderboard,Kvstore } from 'src/pages';

interface Route {
  key: string;
  title: string;
  path: string;
  enabled: boolean;
  component: FC;
}

export const routes: Array<Route> = [
  {
    key: 'main-route',
    title: 'Main',
    path: '/',
    enabled: true,
    component: Main,
  },
  {
    key: 'leaderboard-route',
    title: 'Leaderboard',
    path: '/leaderboard',
    enabled: true,
    component: Leaderboard,
  },
  {
      key: 'kvstore-route',
      title: 'KV Store',
      path: '/kvstore',
      enabled: true,
      component: Kvstore,
  },
];
