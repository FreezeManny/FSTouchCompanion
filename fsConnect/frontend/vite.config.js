import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit(), purgeCss()],
    server: {
        fs: {
            allow: [
                // Allow serving files from the project root
                path.resolve(__dirname),
                // Allow serving files from the wailsjs directory
                path.resolve(__dirname, 'wailsjs')
            ]
        }
    }
});