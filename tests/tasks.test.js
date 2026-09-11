const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../src/app');

async function request(path, options = {}) {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const body = await response.json();
    return { response, body };
  } finally {
    server.close();
  }
}

test('GET /health returns an OK status', async () => {
  const { response, body } = await request('/health');

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
});

test('GET /tasks returns tasks', async () => {
  const { response, body } = await request('/tasks');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});

test('GET /tasks/:id returns 404 for an unknown task', async () => {
  const { response, body } = await request('/tasks/999999');

  assert.equal(response.status, 404);
  assert.equal(body.error, 'Task not found');
});
