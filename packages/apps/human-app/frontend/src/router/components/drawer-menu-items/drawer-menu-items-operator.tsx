import { t } from 'i18next';
import { HelpIcon, UserOutlinedIcon } from '@/shared/components/ui/icons';
import { routerPaths } from '@/router/router-paths';
import { DarkModeSwitch } from '@/shared/components/ui/dark-mode-switch';
import { type MenuItem } from '../layout/protected';

export const operatorDrawerBottomMenuItems: MenuItem[] = [
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
  <DarkModeSwitch key="dark-mode-switch" />,
];
