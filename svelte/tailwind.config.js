import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin';

// Resolve __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}', 
		join(__dirname, 'node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {},
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: {
				preset: [
					{
						name: 'wintry',
						enhancements: true,
					},
				],
			},
		}),
	],
};
