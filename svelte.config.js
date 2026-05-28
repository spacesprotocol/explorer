// svelte.config.js
import adapter from '@sveltejs/adapter-node'; // or your preferred adapter
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Production optimization settings
			precompress: true,  // Enable Brotli & Gzip precompression
			polyfill: false,    // Disable Node polyfills if not needed
			out: 'build'        // Output directory
		}),
		
		// Asset optimization
		inlineStyleThreshold: 8192,  // Inline small styles
		
		// CSP settings if needed
		csp: {
			mode: 'hash',
			directives: {
				'script-src': ['self']
			}
		},
		
		// Additional optimizations
		prerender: {
			handleMissingId: 'ignore'  // More aggressive prerendering
		},
		
		// Environment configuration
		env: {
			dir: '.'
		}
	},
	
	// Enable preprocessing
	preprocess: [vitePreprocess()]
};

export default config;
