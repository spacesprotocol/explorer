import fetch from 'node-fetch';

export class SimpleRpcClient {
    private rpcUrl: string;
    private authHeader: string;
    private id: number;

    constructor(rpcUrl, rpcUser = '', rpcPassword = '') {
        this.rpcUrl = rpcUrl;
        if (rpcUser && rpcPassword) {
            this.authHeader = 'Basic ' + Buffer.from(`${rpcUser}:${rpcPassword}`).toString('base64');
        }
        this.id = 1;
    }

    async request(method, params = []) {
        const rpcRequest = {
            jsonrpc: '2.0',
            id: this.id++,
            method: method,
            params: params
        };

        let headers = {
            'Content-Type': 'application/json',
        };
        if (this.authHeader) {
            headers['Authorization'] = this.authHeader;
        }

        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(rpcRequest)
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                throw new Error(`Failed to parse response: ${responseText}`);
            }

            if (data.error) {
                throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
            }

            return data.result;
        } catch (error) {
            throw error;
        }
    }
}
