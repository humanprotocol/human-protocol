import * as React from 'react';
import {
  Box,
  Link,
  Container,
  Menu,
  Toolbar,
  MenuItem,
  Button,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { routes } from 'src/routes';

const Navbar: React.FC = (): React.ReactElement => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseNavMenu = (): void => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        backgroundColor: 'primary.dark',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: { xs: 'flex' } }}>
            <Button
              id="demo-positioned-button"
              aria-controls={open ? 'demo-positioned-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleOpenNavMenu}
            >
              Jobs
            </Button>
            <Menu
              id="demo-positioned-menu"
              aria-labelledby="demo-positioned-button"
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseNavMenu}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              {routes.map((page) => (
                <MenuItem
                  key={page.key}
                  color="info.main"
                  onClick={handleCloseNavMenu}
                >
                  <Link
                    component={NavLink}
                    to={page.path}
                    color="primary.main"
                    underline="none"
                    variant="button"
                    sx={{ fontSize: 'large' }}
                  >
                    {page.title}
                  </Link>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </Box>
  );
};

export default Navbar;
