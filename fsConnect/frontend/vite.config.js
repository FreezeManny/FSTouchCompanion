import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Tailwind runs as a Vite plugin rather than through PostCSS, so there is no
	// postcss.config.cjs any more. vite-plugin-tailwind-purgecss is gone with
	// it: it only ever supported Tailwind 3, and Tailwind 4 generates just the
	// utilities it finds in the sources, so there is nothing left to purge.
	plugins: [tailwindcss(), sveltekit()]
	// `server.fs.allow` used to open up frontend/wailsjs, a stale second copy of
	// the Wails bindings that sat outside src/. The bindings are now imported
	// from $lib/wailsjs -- where wails.json's `wailsjsdir` actually generates
	// them -- so nothing outside the project root needs serving.
});
