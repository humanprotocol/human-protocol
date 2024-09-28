import { t } from 'i18next';
import type {
  BottomMenuItem,
  TopMenuItem,
} from '@/components/layout/protected/drawer-navigation';
import { HelpIcon, UserOutlinedIcon, WorkIcon } from '@/components/ui/icons';
import { routerPaths } from '@/router/router-paths';

export const workerDrawerTopMenuItems = (
  addressRegistered: boolean
): TopMenuItem[] => {
  return [
    {
      label: t('components.DrawerNavigation.jobs'),
      icon: <WorkIcon />,
      link: routerPaths.worker.jobsDiscovery,
      disabled: !addressRegistered,
    },
  ];
};

export const workerDrawerBottomMenuItems: BottomMenuItem[] = [
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ...
      if ($zoho?.salesiq?.chat?.start) {
        // @ts-expect-error -- ...
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- ...
        $zoho.salesiq.chat.start();
      }
    },
  },
];
