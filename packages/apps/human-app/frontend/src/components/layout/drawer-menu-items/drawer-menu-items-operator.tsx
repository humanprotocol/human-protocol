import { t } from 'i18next';
import type { BottomMenuItem } from '@/components/layout/protected/drawer-navigation';
import { HelpIcon, UserOutlinedIcon } from '@/components/ui/icons';
import { routerPaths } from '@/router/router-paths';

export const operatorDrawerBottomMenuItems: BottomMenuItem[] = [
  {
    label: t('components.DrawerNavigation.profile'),
    link: routerPaths.operator.profile,
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
