import knex from 'knex';
import config from '../config';
import logger from '../utils/logger';

// Determine client type based on DATABASE_URL
const isSQLite = config.database.url.startsWith('sqlite:');

const dbConfig: knex.Knex.Config = {
  client: isSQLite ? 'sqlite3' : 'pg',
  connection: isSQLite 
    ? { filename: config.database.url.replace('sqlite:', '') }
    : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
      },
  useNullAsDefault: isSQLite,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};

const db = knex(dbConfig);

// Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    logger.info(`Database connected successfully (${isSQLite ? 'SQLite' : 'PostgreSQL'})`);
  })
  .catch((err) => {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  });

export default db;
