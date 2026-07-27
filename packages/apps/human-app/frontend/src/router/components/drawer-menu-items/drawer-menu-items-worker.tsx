import { t } from 'i18next';
import type { UserData } from '@/modules/auth/context/auth-context';
import { routerPaths } from '@/router/router-paths';
import { KycStatus } from '@/modules/worker/profile/types';

export const workerDrawerTopMenuItems = (user: UserData | null) => {
  return [
    {
      label: t('components.DrawerNavigation.jobs'),
      link: routerPaths.worker.jobsDiscovery,
      disabled: !user?.wallet_address || user.kyc_status !== KycStatus.APPROVED,
    },
  ];
};
