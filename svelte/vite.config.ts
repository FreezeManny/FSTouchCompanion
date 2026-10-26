import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";


export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      adapter: adapter(),
      csrf: {
        // `checkOrigin` was deprecated; use `trustedOrigins` instead.
        // `checkOrigin: false` allowed all origins, so preserve that behavior
        // by trusting all origins. Note: trusting '*' disables origin checks
        // and is generally not recommended in production unless intentional.
        trustedOrigins: ['*'],
      },

    })
  ],
});
