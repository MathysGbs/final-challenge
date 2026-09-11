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

test('POST /tasks creates a task on valid input', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'New task' })
  });

  assert.equal(response.status, 201);
  assert.equal(body.title, 'New task');
});

test('POST /tasks returns 400 when title is missing', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ description: 'no title' })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title is required');
});

test('POST /tasks returns 400 when status is invalid', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'x', status: 'wrong' })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Status must be one of: todo, in-progress, done');
});

test('POST /tasks returns 400 when title is too long', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'a'.repeat(201) })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title must be at most 200 characters');
});

test('POST /tasks returns 400 when body is malformed', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(['not', 'an', 'object'])
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request body');
});
