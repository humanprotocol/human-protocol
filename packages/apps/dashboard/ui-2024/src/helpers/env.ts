import { ZodError, z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.string(),
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
