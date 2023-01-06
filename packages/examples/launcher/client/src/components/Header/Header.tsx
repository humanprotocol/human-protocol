import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
// import AccountCircle from '@mui/icons-material/AccountCircle';
// import IconButton from '@mui/material/IconButton';
// import { makeStyles } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { makeIsTokenAuthenticated } from '../../services/redux/selectors/auth';
// import { Navbar } from '../Navbar';
import { LinkButton } from '../ButtonLink/LinkButton';
import AccountMenu from './AccountMenu';

const StyledAbbBar = styled(AppBar)(() => ({
  backgroundColor: '#6309ff',
  position: 'fixed',
}));

export const HomeLink = styled(Link)`
  text-decoration: none;
  color: #fff;
  &:hover {
    text-decoration: underline;
    color: #fff;
  }
`;

export const Header: React.FC = (): React.ReactElement => {
  const isAuth = useSelector(makeIsTokenAuthenticated);

  return (
    <Box>
      <StyledAbbBar>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: '#fff' }}
          >
            <HomeLink to="/"> HMT Job Launcher</HomeLink>
          </Typography>
          {!isAuth && (
            <Box
              sx={{
                width: '200px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <LinkButton url="login" title="Login" />
              <LinkButton url="signup" title="Sign Up" />
            </Box>
          )}
          {isAuth && (
            <Box
              sx={{
                width: '200px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <LinkButton url="job-create" title="Create Job" />
            </Box>
          )}
          {isAuth && <AccountMenu />}

          {/* <Navbar title="menu" /> */}
        </Toolbar>
      </StyledAbbBar>
    </Box>
  );
};
