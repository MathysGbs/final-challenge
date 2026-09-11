// src/data/store.js — stockage en mémoire des tâches
let tasks = [
  {
    id: '1',
    title: 'Add dark mode',
    description: 'Add a toggle in settings',
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Fix login bug',
    description: 'Users cannot log in with GitHub',
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextId = 3;

module.exports = {
  getAll() {
    return tasks;
  },
  getById(id) {
    return tasks.find(t => t.id === id);
  },
  create({ title, description = '', status = 'todo' }) {
    const now = new Date().toISOString();
    const task = { id: String(nextId++), title, description, status, createdAt: now, updatedAt: now };
    tasks.push(task);
    return task;
  },
  update(id, fields) {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    Object.assign(task, fields, { updatedAt: new Date().toISOString() });
    return task;
  },
  remove(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tasks.splice(idx, 1);
    return true;
  },
  // utile pour les tests de Shamina : réinitialiser l'état
  _reset() {
    tasks = [];
    nextId = 1;
  }
};