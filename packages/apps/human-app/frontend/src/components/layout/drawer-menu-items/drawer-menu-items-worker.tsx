import { t } from 'i18next';
import type {
  BottomMenuItem,
  TopMenuItem,
} from '@/components/layout/protected/drawer-navigation';
import { HelpIcon, UserOutlinedIcon, WorkIcon } from '@/components/ui/icons';
import { routerPaths } from '@/router/router-paths';
import { DarkModeSwitch } from '@/components/ui/dark-mode-switch';
import type { UserData } from '@/auth/auth-context';

export const workerDrawerTopMenuItems = (
  user: UserData | null
): TopMenuItem[] => {
  return [
    ...[
      {
        label: t('components.DrawerNavigation.jobs'),
        icon: <WorkIcon />,
        link: routerPaths.worker.jobsDiscovery,
        disabled: !user?.wallet_address || user.kyc_status !== 'approved',
      },
    ],
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- ...
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if ($zoho?.salesiq?.chat?.start) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error -- ...
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        $zoho.salesiq.chat.start();
      }
    },
  },
  <DarkModeSwitch key={crypto.randomUUID()} />,
];
