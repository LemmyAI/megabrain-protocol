import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'megabrain_protocol',
      user: process.env.DB_USER || 'megabrain',
      password: process.env.DB_PASSWORD || 'megabrain',
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/database/seeds',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './dist/database/migrations',
      extension: 'js',
    },
    seeds: {
      directory: './dist/database/seeds',
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
  sqlite: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL?.replace('sqlite:', '') || './data/megabrain.db',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
  },
};

export default config;
