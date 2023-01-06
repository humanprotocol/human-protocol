import { NavLink } from 'react-router-dom';
import {
  styled,
  ListItemButton,
  ListItemIcon,
  Typography,
  //   makeStyles,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import * as React from 'react';

import { createStyles, makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => {
  if (!theme.palette?.primary) return {};

  return createStyles({
    activeLink: {
      color: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light,
      borderRight: `3px solid ${theme.palette.primary.main}`,
      '& .MuiTypography-subtitle1': {
        fontWeight: 600,
      },
    },
  });
});

const ListItemStyle = styled(ListItemButton)(() => ({
  padding: 0,
}));

const CustomLinkStyle = styled(NavLink)(({ theme }) => ({
  width: '100%',
  padding: '8px 8px 8px 32px',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: theme.palette.grey['700'],

  '& .MuiListItemIcon-root': {
    minWidth: 'auto',
    marginRight: theme.spacing(2),
    color: 'inherit',
    fontSize: 18,
  },
  '& h6': {
    fontSize: 15,
    fontWeight: 400,
  },
}));

const CustomListItem = ({ onClick, path, icon, title }: any) => {
  const classes = useStyles();
  // console.log(classes);
  if (!classes) return null;
  return (
    <ListItemStyle onClick={onClick}>
      <CustomLinkStyle
        to={path}
        //  activeClassName={classes.activeLink}
      >
        <ListItemIcon>{icon}</ListItemIcon>

        <Typography variant="subtitle1" component="h6">
          {title}
        </Typography>
      </CustomLinkStyle>
    </ListItemStyle>
  );
};

export default CustomListItem;
