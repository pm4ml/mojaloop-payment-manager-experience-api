/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 *       Nguni Phakela - nguni @izyane.com                                *
 **************************************************************************/
const TABLE_NAME = 'fx_transfer';

async function up(knex) {
    return knex.schema.createTable(TABLE_NAME, (table) => {
        table.string('redis_key').primary();  // For easy join
        table.string('commit_request_id').primary();
        table.string('determining_transfer_id');
        table.string('initiating_fsp');
        table.string('counter_party_fsp');
        table.string('amount_type');
        table.string('source_amount');
        table.string('source_currency');
        table.string('target_amount');
        table.string('target_currency');
        table.string('condition');
        table.integer('expiration');
        table.string('conversion_state');
        table.string('fulfilment');
        table.integer('direction');
        table.integer('created_at');
        table.integer('completed_timestamp');
    });
}

async function down(knex) {
    return knex.schema.dropTable(TABLE_NAME);
}

module.exports = { down, up };
