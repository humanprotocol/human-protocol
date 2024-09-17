import { createTheme } from '@mui/material/styles';
import {
	PaletteColorOptions,
	PaletteColor,
} from '@mui/material/styles/createPalette';
import { ThemeOptions } from '@mui/material';
import { colorPalette } from '@assets/styles/color-palette';
import { CSSProperties } from 'react';

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		['Components/Button Small']: true;
		['Components/Button Large']: true;
		['Components/Chip']: true;
		['Components/Table Header']: true;
		['H6-Mobile']: true;
		body3: true;
	}
}

declare module '@mui/material/styles' {
	interface TypographyVariants {
		['Components/Button Small']: CSSProperties;
		['Components/Button Large']: CSSProperties;
		['Components/Chip']: CSSProperties;
		['Components/Table Header']: CSSProperties;
		['H6-Mobile']: CSSProperties;
		body3: CSSProperties;
	}

	// allow configuration using `createTheme`
	interface TypographyVariantsOptions {
		['Components/Button Small']?: CSSProperties;
		['Components/Button Large']?: CSSProperties;
		['Components/Chip']?: CSSProperties;
		['Components/Table Header']?: CSSProperties;
		['H6-Mobile']: CSSProperties;
		body3?: CSSProperties;
	}
}

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
		textSecondary: colorPalette.textSecondary,
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
			fontSize: 20,
			fontWeight: 500,
		},
		'H6-Mobile': {
			fontSize: '20px',
			fontWeight: 500,
			lineHeight: '32px',
			letterSpacing: '0.15px',
			textAlign: 'left',
		},
		body1: {
			fontSize: 16,
			fontWeight: 400,
		},
		body2: {
			fontSize: 14,
			fontWeight: 500,
		},
		body3: {
			fontSize: '12px',
			fontWeight: 400,
			lineHeight: '19.92px',
			letterSpacing: '0.4px',
			textAlign: 'left',
		},
		'Components/Button Small': {
			fontSize: '13px',
			fontWeight: 600,
			lineHeight: '22px',
			letterSpacing: '0.1px',
			textAlign: 'left',
		},
		'Components/Button Large': {
			fontSize: '15px',
			fontWeight: 600,
			lineHeight: '26px',
			letterSpacing: '0.1px',
			textAlign: 'left',
		},
		'Components/Chip': {
			fontSize: '13px',
			fontWeight: 400,
			lineHeight: '18px',
			letterSpacing: '0.16px',
			textAlign: 'left',
		},
		'Components/Table Header': {
			fontFamily: 'Roboto',
			fontSize: '14px',
			fontWeight: 500,
			lineHeight: '24px',
			letterSpacing: '0.17px',
			textAlign: 'left',
		},
		subtitle1: {
			fontSize: 12,
		},
		subtitle2: {
			fontSize: 14,
			fontWeight: 600,
			lineHeight: '21.9px',
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
