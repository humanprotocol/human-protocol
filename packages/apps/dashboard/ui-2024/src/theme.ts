import { createTheme } from '@mui/material/styles';
import { ThemeOptions } from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';

const theme: ThemeOptions = createTheme({
	palette: {
		primary: {
			main: colorPalette.primary.main,
			light: colorPalette.primary.light,
		},
		info: {
			main: colorPalette.info.main,
			light: colorPalette.info.light,
			dark: colorPalette.info.dark,
		},
		secondary: {
			main: colorPalette.secondary.main,
			light: colorPalette.secondary.light,
		},
		text: {
			primary: colorPalette.primary.main,
			secondary: colorPalette.fog.main,
		},
	},
	typography: {
		fontFamily: 'Inter, Arial, sans-serif',
		h3: {
			fontSize: 28,
			fontWeight: 500,
		},
		h4: {
			fontSize: 24,
			fontWeight: 500,
		},
		h5: {
			fontSize: 20,
			fontWeight: 500,
		},
		body1: {
			fontSize: 14,
		},
		body2: {
			fontSize: 14,
			fontWeight: 500,
		},
		subtitle1: {
			fontSize: 10,
		},
		subtitle2: {
			fontSize: 10,
			fontWeight: 600,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					fontWeight: 600,
					textTransform: 'none',
				},
			},
		},
	},
});

export default theme;
