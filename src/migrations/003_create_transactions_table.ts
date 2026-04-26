import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
    table.uuid('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
    table.enu('type', ['credit', 'debit']).notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('description').notNullable();
    table.string('reference').unique().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('transactions');
}