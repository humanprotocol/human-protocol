import { createTheme } from '@mui/material/styles';
import {
	PaletteColorOptions,
	PaletteColor,
} from '@mui/material/styles/createPalette';
import { ThemeOptions } from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';

declare module '@mui/material/styles' {
	interface Palette {
		sky: PaletteColor;
		white: PaletteColor;
		textSecondary: PaletteColor;
	}
	interface PaletteOptions {
		sky?: PaletteColorOptions;
		white?: PaletteColorOptions;
		textSecondary?: PaletteColorOptions;
	}
}

declare module '@mui/material/Button' {
	interface ButtonPropsColorOverrides {
		sky: true;
		white: true;
		textSecondary: true;
	}
}

declare module '@mui/material/IconButton' {
	interface IconButtonPropsColorOverrides {
		sky: true;
		white: true;
		textSecondary: true;
	}
}

declare module '@mui/material/SvgIcon' {
	interface SvgIconPropsColorOverrides {
		sky: true;
		white: true;
		textSecondary: true;
	}
}

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
		sky: {
			main: colorPalette.sky.main,
			light: colorPalette.sky.light,
			dark: colorPalette.sky.dark,
			contrastText: colorPalette.sky.contrastText,
		},
		white: {
			main: '#fff',
			light: '#fff',
			dark: '#fff',
			contrastText: '#fff',
		},
		textSecondary: {
			main: '#858ec6',
			light: '#858ec6',
			dark: '#858ec6',
			contrastText: '#858ec6',
		},
	},
	typography: {
		fontFamily: 'Inter, Arial, sans-serif',
		h1: {
			fontSize: 32,
		},
		h2: {
			fontSize: 34,
			fontWeight: 600,
		},
		h3: {
			fontSize: 24,
			fontWeight: 500,
			'@media (max-width:600px)': {
				fontSize: 20,
			},
		},
		h4: {
			fontSize: 20,
			fontWeight: 500,
		},
		h5: {
			fontSize: 18,
			fontWeight: 600,
		},
		h6: {
			fontSize: 16,
		},
		body1: {
			fontSize: 14,
		},
		body2: {
			fontSize: 14,
			fontWeight: 500,
		},
		subtitle1: {
			fontSize: 12,
		},
		subtitle2: {
			fontSize: 12,
			fontWeight: 600,
		},
		caption: {
			fontSize: 10,
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
		MuiToolbar: {
			styleOverrides: {
				root: {
					'@media (min-width:1001px)': {
						paddingX: 56,
					},
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: '#320a8d',
					color: '#fff',
				},
				arrow: {
					color: '#320a8d',
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				sizeMedium: {
					color: colorPalette.primary.main,
				},
			},
		},
		MuiSelect: {
			styleOverrides: {
				root: {
					borderRadius: 4,
					borderWidth: 2,
					color: '#320a8d',
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: '#320a8d',
						borderWidth: 2,
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: '#320a8d',
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: '#320a8d',
					},
					'& .MuiSvgIcon-root': {
						color: '#320a8d',
					},
				},
			},
		},
		MuiTypography: {
			styleOverrides: {
				root: {
					wordBreak: 'break-word',
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					backgroundColor: colorPalette.white,
				},
			},
		},
	},
});

export default theme;
