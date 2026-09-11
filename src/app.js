const express = require('express');
const config = require('./config');
const tasksRouter = require('./routes/tasks');

const app = express();
app.use(express.json());

app.use('/tasks', tasksRouter);

// GET /health — toujours 200
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    env: config.env
  });
});

if (require.main === module) {
  app.listen(config.port, () =>
    console.log(`Task API listening on ${config.port} (${config.env})`)
  );
}

module.exports = { app };