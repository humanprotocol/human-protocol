import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		svgr({
			include: '**/*.svg',
			exclude: 'src/assets/icons/excluded/**/*.svg',
		}),
	],
	resolve: {
		alias: {
			'@components': path.resolve(__dirname, './src/components'),
			'@helpers': path.resolve(__dirname, './src/helpers'),
			'@assets': path.resolve(__dirname, './src/assets'),
			'@pages': path.resolve(__dirname, './src/pages'),
			'@api': path.resolve(__dirname, './src/api'),
		},
	},
	server: {
		port: 3001,
	},
});
