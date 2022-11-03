import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';
import { getClient } from 'src/queries';
import { networkMap } from 'src/constants';
import Layout from 'src/components/Layout';
import { AppNetworkContext } from './AppNetworkContext';

import './App.css';

export const App: React.FC = (): React.ReactElement => {
  const [network, setNetwork] = React.useState<string>('polygon');

  return (
    <AppNetworkContext.Provider value={{ network, setNetwork }}>
      <ApolloProvider client={getClient(networkMap[network].graphqlClientUrl)}>
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
      </ApolloProvider>
    </AppNetworkContext.Provider>
  );
};
