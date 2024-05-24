import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import App from './App';
import '@assets/styles/main.scss';
import 'simplebar-react/dist/simplebar.min.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<React.StrictMode>
			<App />
		</React.StrictMode>
	</ThemeProvider>
);
