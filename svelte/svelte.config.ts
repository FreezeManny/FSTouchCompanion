import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

const config = {
  extensions: ['.svelte'],
  preprocess: [
    preprocess({
      typescript: true,
    }),
  ],
  kit: {
    adapter: adapter(),
  },
};

export default config;
