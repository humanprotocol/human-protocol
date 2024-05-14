import { ThemeProvider } from '@mui/material/styles';
import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Layout } from '../Layout';
import {
  NotificationProvider,
  QueryClientProvider,
  WagmiProvider,
} from 'src/providers';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';

export const App: FC = () => {
  return (
    <WagmiProvider>
      <QueryClientProvider>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
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
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
