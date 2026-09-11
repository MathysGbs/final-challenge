const express = require('express');
const router = express.Router();
const { validateTask } = require('../middleware/validate'); // Importation du middleware

const store = require('../data/store'); // Couche d'accès aux données

const VALID_STATUS = ['todo', 'in-progress', 'done'];

function applyFilters(tasks, { status, search }) {
  let result = tasks;

  if (status) {
    if (!VALID_STATUS.includes(status)) {
      const err = new Error('Status must be one of: todo, in-progress, done');
      err.statusCode = 400;
      throw err;
    }
    result = result.filter(t => t.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  return result;
}

router.get('/', (req, res) => {
  try {
    const data = applyFilters(store.getAll(), req.query);
    res.status(200).json({ data });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(200).json(task);
});

// Nouvelle route POST sécurisée par validateTask
router.post('/', validateTask, (req, res) => {
  const { title, description, status = 'todo' } = req.body;

  const newTask = store.create({ title, description, status });
  res.status(201).json(newTask);


});

module.exports = router;
module.exports.applyFilters = applyFilters;
module.exports.VALID_STATUS = VALID_STATUS;