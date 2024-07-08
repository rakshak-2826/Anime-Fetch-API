// Example API route: api/proxy.js

import fetch from 'node-fetch';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const url = req.query.url as string;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch resource');
        }

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        // Stream the response from the original server
        response.body.pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
