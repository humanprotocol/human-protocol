import { Link } from 'react-router-dom';
import * as React from 'react';

import {
  styled,
  Toolbar,
  Drawer,
  List,
  Typography,
  Avatar,
  Paper,
  Box,
} from '@mui/material';

import { FaUserPlus, FaListAlt, FaPlusCircle } from 'react-icons/fa';
// import { FaClipboardList } from 'react-icons/gi';
import { RiLoginCircleFill } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import logImg from '../../assets/images/logo.svg';
import userAvatar from '../../assets/images/images/avatar_default.jpg';

import { drawerWidth } from './DashboardLayout';
import CustomListItem from './CustomListItem';
import { makeIsTokenAuthenticated } from '../../services/redux/selectors/auth';

// import CustomListItem from '../components/Drawer/CustomListItem';

const NavDrawerStyle = styled('nav')(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    width: drawerWidth,
    flexShrink: 0,
  },
}));

const LogoStyle = styled(Link)(() => ({
  width: '100px',
}));

const UserCardStyle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: 'inherit',
  backgroundColor: theme.palette.primary.main,
  margin: '12px',
  padding: '14px 12px',
  borderRadius: theme.spacing(1.5),
  textDecoration: 'none',
  '& .MuiTypography-root': {
    marginLeft: theme.spacing(1.5),
  },
}));

const ListStyle = styled(List)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const privateLinks = [
  // { id: 'L6', path: '/404', icon: <GiHazardSign />, title: 'Not Found' },
  { id: 'L7', path: '/jobs', icon: <FaListAlt />, title: 'Jobs list' },
  {
    id: 'L8',
    path: '/job-create',
    icon: <FaPlusCircle />,
    title: 'Create new job',
  },
];

const publicLinks = [
  // { id: 'L1', path: '/user', icon: <FaUserFriends />, title: 'User' },
  { id: 'L4', path: '/login', icon: <RiLoginCircleFill />, title: 'Login' },
  { id: 'L5', path: '/signup', icon: <FaUserPlus />, title: 'Register' },
  // { id: 'L6', path: '/404', icon: <GiHazardSign />, title: 'Not Found' },
];

const SideDrawer = ({ onClose, container, drawerPaper, toggleMenu }: any) => {
  const isAuth = useSelector(makeIsTokenAuthenticated);
  const links = isAuth ? privateLinks : publicLinks;
  const drawerContent = (
    <>
      <Toolbar
        sx={{
          mt: '6px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LogoStyle
          to="/"
          sx={{
            width: '100px',
          }}
        >
          <img className="app-logo mr-3" src={logImg} alt="human-app-logo" />
        </LogoStyle>
      </Toolbar>
      {isAuth && (
        <UserCardStyle onClick={onClose}>
          <Avatar src={userAvatar} alt="User Image" />
          <Typography variant="subtitle1" component="h3" />
        </UserCardStyle>
      )}
      <ListStyle>
        {links.map((el) => (
          <CustomListItem
            key={el.id}
            path={el.path}
            icon={el.icon}
            title={el.title}
            onClick={onClose}
          />
        ))}
      </ListStyle>
    </>
  );

  return (
    <NavDrawerStyle aria-label="Navigation Panel">
      <Paper sx={{ display: { xl: 'none', xs: 'block' } }}>
        <Drawer
          container={container}
          variant="temporary"
          open={toggleMenu}
          onClose={onClose}
          classes={{ paper: drawerPaper }}
          ModalProps={{ keepMounted: true }}
        >
          {drawerContent}
        </Drawer>
      </Paper>

      <Paper sx={{ display: { xs: 'block' } }}>
        <Drawer variant="permanent" open classes={{ paper: drawerPaper }}>
          {drawerContent}
        </Drawer>
      </Paper>
    </NavDrawerStyle>
  );
};

export default SideDrawer;
