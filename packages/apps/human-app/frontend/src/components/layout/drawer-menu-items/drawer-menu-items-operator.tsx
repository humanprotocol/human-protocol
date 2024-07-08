import { t } from 'i18next';
import type { BottomMenuItem } from '@/components/layout/protected/drawer-navigation';
import { HelpIcon, UserOutlinedIcon } from '@/components/ui/icons';
import { routerPaths } from '@/router/router-paths';
import { env } from '@/shared/env';

export const operatorDrawerBottomMenuItems: BottomMenuItem[] = [
  {
    label: t('components.DrawerNavigation.profile'),
    link: routerPaths.operator.profile,
    icon: <UserOutlinedIcon />,
  },
  {
    label: t('components.DrawerNavigation.help'),
    link: env.VITE_HUMAN_PROTOCOL_HELP_URL,
    icon: <HelpIcon />,
  },
];
