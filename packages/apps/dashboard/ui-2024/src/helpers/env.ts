import { ZodError, z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.string(),
	VITE_NAVBAR_LINK_GITBOOK: z.string(),
	VITE_NAVBAR_LINK_FAUCETS: z.string(),
	VITE_NAVBAR_LINK_HUMAN_WEBSITE: z.string(),
	VITE_NAVBAR_LINK_LAUNCH_JOBS: z.string(),
	VITE_NAVBAR_LINK_WORK_AND_EARN: z.string(),
	VITE_HUMANPROTOCOL_CORE_ARCHITECTURE: z.string().optional(),
	VITE_FOOTER_LINK_TERMS_OF_SERVICE: z.string(),
	VITE_FOOTER_LINK_PRIVACY_POLICY: z.string(),
	VITE_FOOTER_LINK_HUMAN_PROTOCOL: z.string(),
	VITE_FOOTER_LINK_GITHUB: z.string(),
	VITE_FOOTER_LINK_DISCORD: z.string(),
	VITE_FOOTER_LINK_X: z.string(),
	VITE_FOOTER_LINK_TELEGRAM: z.string(),
	VITE_FOOTER_LINK_LINKEDIN: z.string(),
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
