import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ProxyOptions } from 'vite';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
const { SSL_CERT_PATH, SSL_KEY_PATH } = process.env;

const server: { proxy: Record<string, string | ProxyOptions>, https?: object} = {
	proxy: {},
}

if (SSL_CERT_PATH && SSL_KEY_PATH) {
	server.https = {
		key: fs.readFileSync(SSL_KEY_PATH),
		cert: fs.readFileSync(SSL_CERT_PATH)
	}
}

export default defineConfig({
	plugins: [sveltekit()],

	build: {
		// Disable source maps in production
		sourcemap: false,
		
		// Production minification
		minify: 'esbuild',
		target: 'esnext',
		
		// Optimize output chunks
		rollupOptions: {
			output: {
				// Optimize chunk size
				chunkFileNames: 'chunks/[name].[hash].js',
				entryFileNames: 'entries/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash][extname]',
				
				// Manual chunk splitting
				manualChunks: (id) => {
					// Group dayjs and its plugins
					if (id.includes('dayjs')) {
						return 'vendor-dayjs';
					}
					
					// Group common components
					if (id.includes('/lib/components/layout/')) {
						return 'common-layout';
					}
					
					// Group feature components
					if (id.includes('/lib/components/')) {
						if (id.includes('RecentActions') || id.includes('Rollout') || id.includes('Stats')) {
							return 'features';
						}
					}
					
					// Group other node_modules
					if (id.includes('node_modules')) {
						const module = id.split('node_modules/').pop()?.split('/')[0];
						if (module) {
							return `vendor-${module}`;
						}
					}
				}
			}
		},

		// Reduce chunk sizes
		chunkSizeWarningLimit: 1000,
	},

	// Optimize CSS
	css: {
		preprocessorOptions: {
			css: {
				imports: true
			}
		},
		devSourcemap: false
	},

	// Your server config
	server,

	optimizeDeps: {
		// Include frequently used dependencies
		include: [
			'dayjs',
			'dayjs/plugin/utc',
			'dayjs/plugin/relativeTime',
			'dayjs/plugin/localizedFormat'
		]
	},

	// Enable modern browser optimizations
	esbuild: {
		target: 'esnext',
		platform: 'browser',
		treeShaking: true
	}
});
