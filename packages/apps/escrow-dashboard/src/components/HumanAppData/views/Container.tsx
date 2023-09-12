import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

import { HumanAppDataChart } from '../chart';

type ChartContainerProps = {
  data: any;
  title: string;
  items: Array<{ label: string; value: any }>;
  onChange: (value: any) => void;
  children?: React.ReactNode;
};

export const ChartContainer = ({
  data,
  title,
  items,
  onChange,
  children,
}: ChartContainerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(600));
  const [tabValue, setTabValue] = useState(items[0].value);
  const [menuValue, setMenuValue] = useState(0);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (isMobile) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          background: '#FFF',
          boxShadow:
            '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA;',
          p: 4,
          pb: 8,
          position: 'relative',
        }}
      >
        <Typography fontSize={24} color="primary">
          {title}
        </Typography>
        <Button
          color="primary"
          size="large"
          variant="contained"
          endIcon={<KeyboardArrowDownIcon />}
          fullWidth
          sx={{
            mt: 3,
            mb: 4,
            boxShadow:
              '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
            fontSize: 14,
            justifyContent: 'space-between',
          }}
          onClick={handleClick}
        >
          {items[menuValue].label}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          MenuListProps={{
            sx: { width: anchorEl && anchorEl.offsetWidth },
          }}
        >
          {items.map((item, index) => (
            <MenuItem
              key={item.value}
              onClick={() => {
                setMenuValue(index);
                onChange(items[index].value);
                handleClose();
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
        {data && <HumanAppDataChart data={data} minHeight={250} />}
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
      }}
    >
      <Tabs
        orientation="vertical"
        value={tabValue}
        onChange={(e, newValue) => {
          setTabValue(newValue);
          onChange(newValue);
        }}
        sx={{
          '& .MuiTabs-indicator': {
            width: '100%',
            left: 0,
            height: '2px !important',
            marginTop: '42px',
          },
        }}
      >
        {items.map((item) => (
          <Tab
            key={item.value}
            label={item.label}
            value={item.value}
            sx={{
              alignItems: 'flex-start',
              padding: '9px 16px',
              lineHeight: '24px',
              minHeight: 'unset',
            }}
          />
        ))}
      </Tabs>
      <Box
        sx={{
          flex: 1,
          borderRadius: '8px',
          background: '#F6F7FE',
          pt: { xs: 5, md: 10 },
          pb: { xs: 5, md: 7 },
          px: { xs: 2, md: 5 },
          ml: { xs: 4, md: 6, xl: '100px' },
          minHeight: 400,
          overflowX: 'auto',
        }}
      >
        {data && (
          <HumanAppDataChart data={data} minHeight={300} minWidth={800} />
        )}
      </Box>
    </Box>
  );
};
