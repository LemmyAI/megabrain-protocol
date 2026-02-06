import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import config from './config';
import logger, { httpLogStream } from './utils/logger';
import agentRoutes from './routes/agents';
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined', { stream: httpLogStream }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

app.use('/v1/agents', agentRoutes);
app.use('/v1/tasks', taskRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

const port = config.port || 4000;
app.listen(port, () => {
  logger.info(`Agent API listening on port ${port}`);
});

export default app;
