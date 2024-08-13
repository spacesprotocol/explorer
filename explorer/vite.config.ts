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
	server
});
