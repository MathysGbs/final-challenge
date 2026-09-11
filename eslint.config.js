const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        fetch: 'readonly' // Autorise fetch (disponible nativement depuis Node 18)
      }
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single']
    }
  },
  {
    // Cible spécifiquement tes fichiers de tests
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest // Remplace par globals.mocha si tu utilises Mocha
      }
    }
  }
];