import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';
import Layout from 'src/components/Layout';

export const App: React.FC = (): React.ReactElement => {
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
