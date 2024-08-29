import { ZodError, z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.string(),
	VITE_NAVBAR_LINK_GITBOOK: z.string(),
	VITE_NAVBAR_LINK_FAUCETS: z.string(),
	VITE_NAVBAR_LINK_HUMAN_WEBSITE: z.string(),
	VITE_NAVBAR_LINK_LAUNCH_JOBS: z.string(),
	VITE_NAVBAR_LINK_WORK_AND_EARN: z.string(),
	VITE_BITFINEX_LINK: z.string().optional(),
	VITE_PROBITGLOBAL_LINK: z.string().optional(),
	VITE_GATEIO_LINK: z.string().optional(),
	VITE_BINGX_LINK: z.string().optional(),
	VITE_COINLISTPRO_LINK: z.string().optional(),
	VITE_LBANK_LINK: z.string().optional(),
	VITE_HUMANPROTOCOL_CORE_ARCHITECTURE: z.string().optional(),
});

let validEnvs;

function setError() {
	const root = document.getElementById('root');
	if (!root) return;

	const errorDiv = document.createElement('div');
	errorDiv.textContent = 'Invalid .env file. Open devtools to see more details';
	root.appendChild(errorDiv);
}

try {
	validEnvs = envSchema.parse(import.meta.env);
} catch (error) {
	if (error instanceof ZodError) {
		console.error('Invalid .env file');
		error.issues.forEach((issue) => {
			console.error('Invalid env:', issue.path.join());
			console.error(issue);
		});
		setError();
		throw new Error();
	}
	setError();
	console.error(error);
	throw new Error();
}

export const env = validEnvs;
