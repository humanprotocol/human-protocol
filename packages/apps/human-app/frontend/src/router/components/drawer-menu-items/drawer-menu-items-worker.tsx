import { t } from 'i18next';
import {
  HelpIcon,
  UserOutlinedIcon,
  WorkIcon,
} from '@/shared/components/ui/icons';
import { DarkModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import type { UserData } from '@/modules/auth/context/auth-context';
import { routerPaths } from '@/router/router-paths';
import { KycStatus } from '@/modules/worker/profile/types';
import { type MenuItem } from '../layout/protected';

export const workerDrawerTopMenuItems = (user: UserData | null): MenuItem[] => {
  return [
    {
      label: t('components.DrawerNavigation.jobs'),
      icon: <WorkIcon />,
      link: routerPaths.worker.jobsDiscovery,
      disabled: !user?.wallet_address || user.kyc_status !== KycStatus.APPROVED,
    },
  ];
};

export const workerDrawerBottomMenuItems: MenuItem[] = [
  {
    label: t('components.DrawerNavigation.profile'),
    link: routerPaths.worker.profile,
    icon: <UserOutlinedIcon />,
  },
  {
    label: t('components.DrawerNavigation.help'),
    icon: <HelpIcon />,
    onClick: () => {
      // @ts-expect-error -- ...
      if ($zoho?.salesiq?.chat?.start) {
        // @ts-expect-error -- ...
        $zoho.salesiq.chat.start();
      }
    },
  },
  <DarkModeSwitch key="dark-mode-switch" />,
];
