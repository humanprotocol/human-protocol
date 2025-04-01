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
