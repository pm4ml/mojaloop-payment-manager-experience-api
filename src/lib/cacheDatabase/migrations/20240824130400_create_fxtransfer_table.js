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
const Knex = require('knex');

const TABLE_NAME = 'fx_transfer';

async function up(knex) {
  return knex.schema.createTable(TABLE_NAME, (table) => {
      table.string('initiating_fsp');
      table.string('counter_party_fsp');
      table.string('amount_type');
      table.string('source_amount');
      table.string('source_currency');
      table.string('target_amount');
      table.string('target_currency');
      table.integer('expiration');
      table.string('determining_transfer_id');
      table.string('condition');
      table.string('commit_request_id');
      table.string('conversion_state');
      table.integer('completed_timestamp');
      table.integer('created_at');
      table.string('fulfilment');
  });
}

async function down(knex) {
  return knex.schema.dropTable(TABLE_NAME);
}

module.exports = { down, up };