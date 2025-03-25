import {
  List,
  ListItem,
  Stack,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks';
import { colorPalette } from '@/shared/styles/color-palette';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { type DrawerItem, type TopMenuItem } from './drawer-navigation';
import { NAVBAR_PADDING } from './navbar';

interface MenuItemListProps {
  handleItemClick: (item: DrawerItem) => void;
  items?: TopMenuItem[];
}

export function TopMenuItemsList({
  handleItemClick,
  items,
}: Readonly<MenuItemListProps>) {
  const { isDarkMode } = useColorMode();
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <List
      sx={{
        marginTop: isMobile ? '66px' : '16px',
      }}
    >
      {items?.map((item, index) => {
        if (!('label' in item)) {
          return (
            <ListItem key={crypto.randomUUID()}>
              <Stack
                direction="row"
                sx={{
                  ml: isMobile ? '28px' : NAVBAR_PADDING,
                }}
              >
                {item}
              </Stack>
            </ListItem>
          );
        }

        const { link, label, disabled, icon } = item;
        const isActive = Boolean(link && location.pathname === link);

        return (
          <ListItem
            disablePadding
            key={link}
            sx={{ padding: '0 8px', borderRadius: '4px' }}
          >
            <ListItemButton
              disabled={disabled}
              onClick={() => {
                handleItemClick(item);
              }}
              selected={isActive}
              sx={{
                borderRadius: '4px',
                p: 0,
                '&.Mui-selected': {
                  backgroundColor: isDarkMode
                    ? onlyDarkModeColor.listItemColor
                    : colorPalette.primary.shades,
                },
              }}
            >
              <Stack
                alignItems="center"
                direction="row"
                gap="32px"
                justifyContent="center"
                sx={{
                  padding: '8px 16px',
                }}
              >
                {icon}
                <ListItemText
                  disableTypography
                  primary={
                    <Typography
                      component="span"
                      variant={isMobile ? 'h5' : 'body1'}
                    >
                      {label}
                    </Typography>
                  }
                  sx={{
                    marginLeft: index === 0 ? '10px' : '0px',
                  }}
                />
              </Stack>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
