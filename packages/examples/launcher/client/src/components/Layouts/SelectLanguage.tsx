import { withStyles } from '@mui/styles';
import {
  IconButton,
  styled,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import React from 'react';
import EN_FLAG from '../../assets/images/ic_flag_en.svg';
import FR_FLAG from '../../assets/images/ic_flag_fr.svg';
import DE_FLAG from '../../assets/images/ic_flag_de.svg';

// Menu styles
export const StyledMenu = withStyles((theme) => ({
  paper: {
    minWidth: 175,
    boxShadow: `0 2px 10px -5px ${theme.palette.green.darker}`,
  },
}))((props) => (
  <Menu
    elevation={0}
    open
    // getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

export const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:active': {
      backgroundColor: theme.palette.green.light,
    },
    '& .MuiListItemText-primary': {
      marginLeft: theme.spacing(2.5),
      fontSize: theme.spacing(2.25),
    },
  },
}))(MenuItem);

const IconButtonStyle = styled(IconButton)(({ theme }) => ({
  padding: '12px 9px',
  '& img': {
    width: theme.spacing(3),
  },
}));

// Language list
const languages = [
  { src: EN_FLAG, alt: 'English' },
  { src: DE_FLAG, alt: 'German' },
  { src: FR_FLAG, alt: 'French' },
];

const LanguageSelector = ({ onOpen, anchorEl, onClose }: any) => {
  return (
    <>
      <IconButtonStyle
        aria-controls="language-selector"
        aria-haspopup="true"
        onClick={onOpen}
      >
        <img src={EN_FLAG} alt="English" />
      </IconButtonStyle>

      <Menu
        id="customized menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={onClose}
      >
        {languages.map((el) => (
          <MenuItem key={el.alt} onClick={onClose}>
            <img src={el.src} alt={el.alt} />

            <ListItemText primary={el.alt} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
