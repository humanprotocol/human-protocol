import { ThemeProvider } from '@mui/material/styles';
import { FC } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { routes as appRoutes } from '../../routes';
import theme from '../../theme';
import { Layout } from '../Layout';

export const App: FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            {appRoutes.map((route) => (
              <Route
                key={route.key}
                path={route.path}
                element={<route.component />}
              />
            ))}
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};
