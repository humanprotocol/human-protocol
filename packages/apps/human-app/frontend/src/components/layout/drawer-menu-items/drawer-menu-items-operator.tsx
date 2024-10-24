import { t } from 'i18next';
import type { BottomMenuItem } from '@/components/layout/protected/drawer-navigation';
import { HelpIcon, UserOutlinedIcon } from '@/components/ui/icons';
import { routerPaths } from '@/router/router-paths';
import { DarkModeSwitch } from '@/components/ui/dark-mode-switch';

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
      if ($zoho?.salesiq?.chat?.start) {
        // @ts-expect-error -- ...
        $zoho.salesiq.chat.start();
      }
    },
  },
  <DarkModeSwitch key={crypto.randomUUID()} />,
];
