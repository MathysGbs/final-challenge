const express = require('express');
const router = express.Router();

const store = require('../data/store'); // à adapter au vrai stockage de l'équipe

const VALID_STATUS = ['todo', 'in-progress', 'done'];

// Logique pure de filtrage — exportée pour les tests de Shamina
function applyFilters(tasks, { status, search }) {
  let result = tasks;

  // Feature A : filtrage par statut
  if (status) {
    if (!VALID_STATUS.includes(status)) {
      const err = new Error('Status must be one of: todo, in-progress, done');
      err.statusCode = 400;
      throw err;
    }
    result = result.filter(t => t.status === status);
  }

  // Feature B : recherche insensible à la casse sur title OU description
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }

  return result;
}

// GET /tasks?status=&search=  → renvoie { data: [...] }
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
// GET /tasks/:id → l'objet task seul, ou 404
router.get('/:id', (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(200).json(task);
});
module.exports = router;
module.exports.applyFilters = applyFilters;
module.exports.VALID_STATUS = VALID_STATUS;