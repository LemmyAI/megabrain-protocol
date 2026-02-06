import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Agents table (workers and evaluators)
  await knex.schema.createTable('agents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('public_key').notNullable().unique();
    table.string('agent_type').notNullable(); // 'worker', 'evaluator', 'both'
    table.string('address').unique();
    table.decimal('worker_reputation', 10, 4).defaultTo(1.0);
    table.decimal('evaluator_reputation', 10, 4).defaultTo(1.0);
    table.integer('tasks_completed').defaultTo(0);
    table.integer('evaluations_completed').defaultTo(0);
    table.decimal('total_earned', 20, 8).defaultTo(0);
    table.decimal('total_staked', 20, 8).defaultTo(0);
    table.decimal('total_slashed', 20, 8).defaultTo(0);
    table.jsonb('capabilities').defaultTo('[]');
    table.jsonb('webhooks').defaultTo('[]');
    table.timestamp('last_active');
    table.timestamps(true, true);
    
    table.index('public_key');
    table.index('agent_type');
    table.index('worker_reputation');
    table.index('evaluator_reputation');
  });

  // Tasks table
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('task_id').notNullable().unique(); // On-chain task ID
    table.uuid('requester_id').references('id').inTable('agents');
    table.string('status').notNullable().defaultTo('created'); // created, open, evaluating, settled, disputed, inconclusive
    table.text('description').notNullable();
    table.string('task_class').notNullable();
    table.integer('worker_count').defaultTo(3);
    table.integer('evaluator_count').defaultTo(2);
    table.decimal('total_budget', 20, 8).notNullable();
    table.decimal('worker_pool', 20, 8).notNullable();
    table.decimal('evaluator_pool', 20, 8).notNullable();
    table.decimal('bonus_pool', 20, 8).notNullable();
    table.decimal('worker_stake', 20, 8).notNullable();
    table.decimal('evaluator_stake', 20, 8).notNullable();
    table.timestamp('submission_deadline').notNullable();
    table.timestamp('evaluation_deadline');
    table.timestamp('dispute_deadline');
    table.string('result_hash'); // IPFS hash or content address
    table.jsonb('metadata').defaultTo('{}');
    table.decimal('consensus_score', 10, 4);
    table.string('winning_cluster_hash');
    table.decimal('total_paid', 20, 8).defaultTo(0);
    table.decimal('total_slashed', 20, 8).defaultTo(0);
    table.timestamps(true, true);
    
    table.index('task_id');
    table.index('status');
    table.index('task_class');
    table.index('submission_deadline');
  });

  // Task participants (workers and evaluators)
  await knex.schema.createTable('task_participants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('agent_id').references('id').inTable('agents');
    table.string('role').notNullable(); // 'worker', 'evaluator'
    table.decimal('stake_amount', 20, 8).notNullable();
    table.string('stake_tx_hash');
    table.string('status').defaultTo('pending'); // pending, active, slashed, rewarded
    table.decimal('payment_amount', 20, 8).defaultTo(0);
    table.string('payment_tx_hash');
    table.timestamp('selected_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.unique(['task_id', 'agent_id', 'role']);
    table.index(['task_id', 'role']);
    table.index(['agent_id', 'status']);
  });

  // Submissions (worker results)
  await knex.schema.createTable('submissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('worker_id').references('id').inTable('agents');
    table.uuid('participant_id').references('id').inTable('task_participants');
    table.text('summary').notNullable();
    table.jsonb('result').notNullable();
    table.string('result_hash').notNullable(); // keccak256 hash
    table.string('ipfs_hash'); // Full result stored on IPFS
    table.decimal('embedding_vector_length', 10, 4); // Length of embedding for similarity calc
    table.jsonb('embedding'); // Stored as JSON array
    table.decimal('final_score', 10, 4);
    table.boolean('in_consensus').defaultTo(false);
    table.integer('cluster_id');
    table.decimal('cluster_distance', 10, 6);
    table.string('status').defaultTo('submitted'); // submitted, evaluated, rewarded, slashed
    table.timestamps(true, true);
    
    table.unique(['task_id', 'worker_id']);
    table.index(['task_id', 'status']);
    table.index(['cluster_id']);
  });

  // Evaluations
  await knex.schema.createTable('evaluations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('evaluator_id').references('id').inTable('agents');
    table.uuid('submission_id').references('id').inTable('submissions').onDelete('CASCADE');
    table.uuid('worker_id').references('id').inTable('agents');
    table.integer('score').notNullable(); // 0-100
    table.decimal('confidence', 3, 2).notNullable(); // 0.0-1.0
    table.text('rationale');
    table.jsonb('corrections').defaultTo('[]');
    table.jsonb('metadata').defaultTo('{}');
    table.decimal('consensus_distance', 10, 4);
    table.boolean('is_outlier').defaultTo(false);
    table.decimal('alignment_score', 3, 2); // How well it aligns with final consensus
    table.decimal('reward_amount', 20, 8).defaultTo(0);
    table.string('status').defaultTo('submitted'); // submitted, processed, rewarded, slashed
    table.timestamps(true, true);
    
    table.unique(['task_id', 'evaluator_id', 'worker_id']);
    table.index(['task_id', 'evaluator_id']);
    table.index(['submission_id']);
  });

  // Semantic clusters
  await knex.schema.createTable('clusters', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('cluster_id').notNullable();
    table.string('cluster_hash').notNullable(); // Hash of cluster contents
    table.jsonb('centroid'); // Average embedding of cluster
    table.integer('submission_count').defaultTo(0);
    table.decimal('average_score', 10, 4);
    table.decimal('coherence_score', 10, 4); // How tight the cluster is
    table.boolean('is_dominant').defaultTo(false);
    table.decimal('dominance_ratio', 5, 4); // Size relative to total
    table.timestamps(true, true);
    
    table.unique(['task_id', 'cluster_id']);
    table.index(['task_id', 'is_dominant']);
  });

  // Settlement records
  await knex.schema.createTable('settlements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').references('id').inTable('tasks').unique();
    table.string('settlement_tx_hash');
    table.jsonb('distribution'); // Payment distribution details
    table.jsonb('consensus_data');
    table.decimal('total_paid', 20, 8).defaultTo(0);
    table.decimal('total_slashed', 20, 8).defaultTo(0);
    table.string('status').defaultTo('pending'); // pending, submitted, confirmed, failed
    table.integer('confirmations').defaultTo(0);
    table.text('error_message');
    table.timestamp('triggered_at');
    table.timestamp('confirmed_at');
    table.timestamps(true, true);
    
    table.index(['status']);
    table.index(['settlement_tx_hash']);
  });

  // Webhook logs
  await knex.schema.createTable('webhook_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agent_id').references('id').inTable('agents');
    table.string('event_type').notNullable();
    table.string('webhook_url').notNullable();
    table.jsonb('payload').notNullable();
    table.integer('response_status');
    table.text('response_body');
    table.integer('retry_count').defaultTo(0);
    table.string('status').defaultTo('pending'); // pending, delivered, failed
    table.timestamp('delivered_at');
    table.timestamps(true, true);
    
    table.index(['agent_id', 'event_type']);
    table.index(['status']);
  });

  // Reputation history
  await knex.schema.createTable('reputation_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agent_id').references('id').inTable('agents');
    table.uuid('task_id').references('id').inTable('tasks');
    table.string('event_type').notNullable(); // task_completed, evaluation_submitted, slashed, etc.
    table.decimal('worker_reputation_delta', 10, 4).defaultTo(0);
    table.decimal('evaluator_reputation_delta', 10, 4).defaultTo(0);
    table.decimal('worker_reputation_after', 10, 4);
    table.decimal('evaluator_reputation_after', 10, 4);
    table.text('reason');
    table.timestamps(true, true);
    
    table.index(['agent_id', 'event_type']);
    table.index(['task_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reputation_history');
  await knex.schema.dropTableIfExists('webhook_logs');
  await knex.schema.dropTableIfExists('settlements');
  await knex.schema.dropTableIfExists('clusters');
  await knex.schema.dropTableIfExists('evaluations');
  await knex.schema.dropTableIfExists('submissions');
  await knex.schema.dropTableIfExists('task_participants');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('agents');
}
