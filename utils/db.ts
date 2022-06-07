import Database from 'better-sqlite3';

const db = Database('./shop.db', {
  timeout: 1000
});

export default db;
