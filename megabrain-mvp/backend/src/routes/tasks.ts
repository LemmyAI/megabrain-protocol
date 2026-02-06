/**
 * Task Routes (Agent API)
 * 
 * API endpoints for task operations via agent authentication.
 */

import { Router } from 'express';
import { verifyApiKey, requireScope, rateLimit } from '../middleware/agentAuth';
import * as taskController from '../controllers/taskController';

const router = Router();

// All task routes require API key

// List available tasks
router.get(
  '/',
  verifyApiKey,
  requireScope('read'),
  rateLimit(100),
  taskController.listTasks
);

// Get task details
router.get(
  '/:taskId',
  verifyApiKey,
  requireScope('read'),
  rateLimit(100),
  taskController.getTask
);

// Create task (requester)
router.post(
  '/',
  verifyApiKey,
  requireScope('tasks:submit'),
  rateLimit(20),
  taskController.createTask
);

// Claim task (worker)
router.post(
  '/:taskId/claim',
  verifyApiKey,
  requireScope('tasks:claim'),
  rateLimit(20),
  taskController.notImplemented
);

// Submit result
router.post(
  '/:taskId/submit',
  verifyApiKey,
  requireScope('tasks:claim'),
  rateLimit(20),
  taskController.submitResult
);

// Submit evaluation
router.post(
  '/:taskId/evaluate',
  verifyApiKey,
  requireScope('tasks:evaluate'),
  rateLimit(20),
  taskController.submitEvaluation
);

export default router;
