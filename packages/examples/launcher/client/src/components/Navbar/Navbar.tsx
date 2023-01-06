import * as React from 'react';
import {
  Box,
  Link,
  Container,
  Menu,
  Toolbar,
  MenuItem,
  Button,
  styled,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { routes } from '../Routes/routes';

export type INavbar = {
  title: string;
};

const StyledButton = styled(Button)(() => ({
  backgroundColor: '#fff',
  color: '#6309ff',
  '&:hover': {
    backgroundColor: '#fff',
    color: '#6309ff',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
  ' &:focus': {
    backgroundColor: '#fff',
    color: '#6309ff',
  },
}));

const StyledMenu = styled(Menu)(() => ({
  color: '#6309ff',
}));

export const Navbar: React.FC<INavbar> = ({ title }): React.ReactElement => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseNavMenu = (): void => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box sx={{ display: { xs: 'flex' } }}>
            <StyledButton
              id="positioned-button"
              aria-controls={open ? 'positioned-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleOpenNavMenu}
            >
              {title}
            </StyledButton>
            <StyledMenu
              id="positioned-menu"
              aria-labelledby="positioned-button"
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
              {routes.map((page) => {
                return (
                  <Link
                    component={NavLink}
                    variant="button"
                    to={page.path}
                    color="primary.main"
                    underline="none"
                    sx={{ fontSize: 'large' }}
                    onClick={handleCloseNavMenu}
                    key={page.key}
                  >
                    <MenuItem color="info.main">{page.title}</MenuItem>
                  </Link>
                );
              })}
            </StyledMenu>
          </Box>
        </Toolbar>
      </Container>
    </Box>
  );
};
