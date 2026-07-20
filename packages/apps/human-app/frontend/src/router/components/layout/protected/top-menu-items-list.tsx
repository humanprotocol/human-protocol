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
import { isDrawerItem } from '../helpers';
import { type DrawerItem, type MenuItem } from './drawer-navigation';

interface MenuItemListProps {
  handleItemClick: (item: DrawerItem) => void;
  items?: MenuItem[];
}

export function TopMenuItemsList({
  handleItemClick,
  items,
}: Readonly<MenuItemListProps>) {
  const { isDarkMode } = useColorMode();
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <List sx={{ mt: { xs: 8, md: 2 } }}>
      {items?.map((item) => {
        if (!isDrawerItem(item)) {
          return (
            <ListItem key={`list-item-${item.key}`}>
              <Stack direction="row" sx={{ ml: { xs: 7, md: 2 } }}>
                {item}
              </Stack>
            </ListItem>
          );
        }

        const { link, label, disabled, icon } = item;
        const isActive = location.pathname === link;

        return (
          <ListItem
            disablePadding
            key={label}
            sx={{
              padding: '0 8px',
              borderRadius: '4px',
              '&:first-of-type .MuiListItemText-root': {
                ml: '10px',
              },
            }}
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
                direction="row"
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 1,
                  px: 2,
                  gap: 4,
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
                />
              </Stack>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
