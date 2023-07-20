import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import CreditCardFilledIcon from '../assets/CreditCardFilled.svg';
import logoImg from '../assets/logo.svg';
import PlusIcon from '../assets/Plus.svg';
import { AuthHeader } from '../components/Headers/AuthHeader';

const drawerWidth = 256;

export default function AuthLayout() {
  const [show, setShow] = useState(true);

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Toolbar>
          <img src={logoImg} alt="HUMAN App" style={{ width: 192 }} />
        </Toolbar>
        <List>
          <ListItem>
            <ListItemButton onClick={() => setShow(!show)}>
              <ListItemIcon>
                <img src={CreditCardFilledIcon} alt="Jobs" />
              </ListItemIcon>
              <ListItemText primary="Jobs" />
            </ListItemButton>
          </ListItem>
          <Collapse in={show}>
            <ListItem sx={{ pl: 9, py: 0 }}>
              <List disablePadding>
                <ListItem>
                  <Link to="/jobs/launched">Launched</Link>
                </ListItem>
                <ListItem>
                  <Link to="/jobs/pending">Pending</Link>
                </ListItem>
                <ListItem>
                  <Link to="/jobs/completed">Completed</Link>
                </ListItem>
                <ListItem>
                  <Link to="/jobs/cancelled">Cancelled</Link>
                </ListItem>
                <ListItem>
                  <Link to="/jobs/failed">Failed</Link>
                </ListItem>
              </List>
            </ListItem>
          </Collapse>
          <ListItem>
            <ListItemButton>
              <Link
                to="/jobs/create"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <ListItemIcon>
                  <img src={PlusIcon} alt="Add New Job" />
                </ListItemIcon>
                <ListItemText primary="Add New Job" />
              </Link>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 4,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: '#F6F7FE',
        }}
      >
        <AuthHeader />
        <Box sx={{ pt: 11, pb: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
