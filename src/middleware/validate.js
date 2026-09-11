const VALID_STATUS = ['todo', 'in-progress', 'done'];
const TITLE_MAX_LENGTH = 200;

function validateTask(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
  return res.status(400).json({ error: 'Invalid request body' });
}

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (body.title.length > TITLE_MAX_LENGTH) {
    return res.status(400).json({ error: `Title must be at most ${TITLE_MAX_LENGTH} characters` });
  }

  if (body.status && !VALID_STATUS.includes(body.status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUS.join(', ')}` });
  }

  next();
}

module.exports = { validateTask, VALID_STATUS, TITLE_MAX_LENGTH };