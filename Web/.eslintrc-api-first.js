/**
 * Regras ESLint para garantir arquitetura API-First
 * 
 * Este arquivo pode ser importado no eslint.config.js para adicionar
 * validações que previnem acesso direto ao banco de dados.
 */

module.exports = {
  rules: {
    // Prevenir imports do backend
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/Server/**', '**/database/**'],
            message: 'Não é permitido importar código do backend. Use a API em src/api/api.ts',
          },
        ],
      },
    ],
    // Prevenir uso de bibliotecas de banco
    'no-restricted-modules': [
      'error',
      {
        patterns: [
          {
            group: ['psycopg2', 'sqlalchemy', 'pg', 'postgres', 'mysql', 'sqlite3'],
            message: 'Não é permitido usar bibliotecas de banco de dados no frontend. Use a API.',
          },
        ],
      },
    ],
  },
};

