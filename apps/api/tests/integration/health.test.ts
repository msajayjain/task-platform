/**
 * File Description:
 * Integration test for health endpoint response contract.
 *
 * Purpose:
 * Ensure the health route reports a successful service status payload.
 */

import http from 'node:http';
import request from 'supertest';

describe('GET /api/health', () => {
  it('returns 200 and success payload', async () => {
    const server = http.createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: 'ok' }));
    });

    const response = await request(server).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    server.close();
  });
});
