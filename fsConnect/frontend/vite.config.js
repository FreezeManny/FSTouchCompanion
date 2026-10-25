import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Tailwind runs as a Vite plugin rather than through PostCSS, so there is no
	// postcss.config.cjs any more. vite-plugin-tailwind-purgecss is gone with
	// it: it only ever supported Tailwind 3, and Tailwind 4 generates just the
	// utilities it finds in the sources, so there is nothing left to purge.
	plugins: [
		tailwindcss(),
		sveltekit({
			extensions: ['.svelte'],
			// Consult https://kit.svelte.dev/docs/integrations#preprocessors
			// for more information about preprocessors
			preprocess: [vitePreprocess()],
			// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
			// If your environment is not supported or you settled on a specific environment, switch out the adapter.
			// See https://kit.svelte.dev/docs/adapters for more information about adapters.
			adapter: adapter({ fallback: 'index.html' })
		})
	]
	// `server.fs.allow` used to open up frontend/wailsjs, a stale second copy of
	// the Wails bindings that sat outside src/. The bindings are now imported
	// from $lib/wailsjs -- where wails.json's `wailsjsdir` actually generates
	// them -- so nothing outside the project root needs serving.
});
