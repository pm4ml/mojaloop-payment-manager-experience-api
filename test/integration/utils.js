/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 *       Nguni Phakela - nguni@izyane.com                                *
 **************************************************************************/

const { Logger } = require('@mojaloop/sdk-standard-components');
const { createMemoryCache } = require('../../src/lib/cacheDatabase/');
const transferTemplate  = require('./data/transferTemplate.json');
const lastError  = require('./data/lastError.json');
// eslint-disable-next-line no-unused-vars
const Cache = require('../../src/lib/cacheDatabase/cache');

const createTestDb = async () => {
    const logger = new Logger.Logger({ context: { app: 'database-cache-unit-tests'}, stringify: () => {}});
  
    const db = await createMemoryCache({
        cacheUrl: 'redis://localhost:6739/0',
        logger,
        manualSync: true
    });

    return db;
};

const addTransferToCache = async (db, opts) => {
    const transfer = JSON.parse(JSON.stringify(transferTemplate));
    transfer.transferId = opts.transferId || transfer.transferId;
    transfer.amountType = opts.amountType || transfer.amountType;
    transfer.currency = opts.currency || transfer.currency;
    transfer.amount = opts.amount || transfer.amount;
    transfer.transactionType = opts.transactionType || transfer.transactionType;
    transfer.currentState = opts.currentState || transfer.currentState;
    if (opts.currentState === 'errored') {
        transfer.lastError = JSON.parse(JSON.stringify(lastError));
    }
    transfer.initiatedTimestamp = opts.initiatedTimestamp || transfer.initiatedTimestamp;
    if (opts.isPending) {
        delete transfer.fulfil;
    } else {
        transfer.fulfil.body.completedTimestamp = opts.completedTimestamp || transfer.fulfil.body.completedTimestamp;
    }

    await db.redisCache().set(`transferModel_${opts.transferId}`, JSON.stringify(transfer));

    return transfer;
};

module.exports = { createTestDb, addTransferToCache };