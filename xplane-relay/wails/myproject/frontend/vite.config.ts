import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit(), purgeCss()],
    server: {
        fs: {
            allow: [
                // Add the wailsjs directory to the allow list
                path.resolve(__dirname, 'wailsjs')
            ]
        }
    }
});