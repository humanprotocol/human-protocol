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
    link: routerPaths.homePage,
    icon: <HelpIcon />,
  },
];
