import { FC, useState }  from 'react';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import logo from '@assets/logo.png';
import logoMobile from '@assets/logo-mobile.png';

const Header: FC = () => {
  const [open, setState] = useState(false);

  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleDrawer = (open: boolean) => {
  setState(open);
};

  return (
    <Toolbar className="header-toolbar">
      <img className='logo' src={logo} alt="logo"/>
      <img className='logo-mobile'src={logoMobile} alt="logo"/>

      <div className='header-list-link'>
        <div className='header-link' onClick={() => handleClick('https://app.humanprotocol.org/')}>
          GitBook
        </div>
        <div className='header-link' onClick={() => handleClick('https://app.humanprotocol.org/')}>
          KV Store
        </div>
        <div className='header-link' onClick={() => handleClick('https://app.humanprotocol.org/')}>
          Faucet
        </div>
        <div className='header-link' onClick={() => handleClick('https://app.humanprotocol.org/')}>
          HUMAN Website
        </div>
        <Button variant="contained" color="primary" onClick={() => handleClick('https://app.humanprotocol.org/')}>
          Launch Jobs
        </Button>
        <Button variant="contained" color="secondary" onClick={() => handleClick('https://app.humanprotocol.org/')}>
          Work & Earn
        </Button>
      </div>

      <IconButton
        edge="start"
        color="inherit"
        aria-label="open drawer"
        className='mobile-icon'
        onClick={() => toggleDrawer(true)}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="right"
        variant="temporary"
        open={open}
        onClose={() => toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: '80%',
          },
        }}
      >
        <Box className="header-mobile-menu">
          <div className='header-list-link'>
            <div className='header-link'>
              GitBook
            </div>
            <div className='header-link'>
              KV Store
            </div>
            <div className='header-link'>
              Faucet
            </div>
            <div className='header-link'>
              HUMAN Website
            </div>
            <Button variant="contained" color="primary" onClick={() => handleClick('https://app.humanprotocol.org/')}>
              Launch Jobs
            </Button>
            <Button variant="contained" color="secondary" onClick={() => handleClick('https://app.humanprotocol.org/')}>
              Work & Earn
            </Button>
          </div>
        </Box>
      </Drawer>
    </Toolbar>
  );
};

export default Header;