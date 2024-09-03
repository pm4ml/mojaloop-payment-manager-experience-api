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

    // fxquotesResponse data
    table.string('fx_commit_request_id');
    table.string('fx_determining_transfer_id');
    table.string('fx_sender_id_type');
    table.string('fx_sender_id_sub_value');
    table.string('fx_sender_id_value');
    table.string('fx_recipient');
    table.string('fx_recipient_id_type');
    table.string('fx_recipient_id_sub_value');
    table.string('fx_recipient_id_value');
    table.string('fx_amount');
    table.string('fx_currency');
    table.string('fx_direction');
    table.string('fx_condition');
    table.string('fx_fulfilment');
    table.string('fx_completed_timestamp');
    table.string('fx_conversion_state');
  });
}

async function down(knex) {
  return knex.schema.dropTable(TABLE_NAME);
}