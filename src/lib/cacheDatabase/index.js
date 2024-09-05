/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

const knex = require('knex');
const Cache = require('./cache');

const cachedFulfilledKeys = [];
const cachedPendingKeys = [];

const getName = (userInfo) =>
    userInfo &&
    (userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`);

const getTransferStatus = (data) => {
    if (data.currentState === 'succeeded') {
        return true;
    } else if (data.currentState === 'errored') {
        return false;
    } else {
        return null;
    }
};

const getInboundTransferStatus = (data) => {
    switch (data.currentState) {
        case 'COMPLETED':
            return true;
        case 'ERROR_OCCURRED':
        case 'ABORTED':
            return false;
        default:
            return null;
    }
};

const getPartyNameFromQuoteRequest = (qr, partyType) => {
    // return display name if we have it
    if (qr.body[partyType].name) {
        return qr.body[partyType].name;
    }

    // otherwise try to build the name from the personalInfo
    const { complexName } = qr.body[partyType].personalInfo || {};

    if (complexName) {
        const n = [];
        const { firstName, middleName, lastName } = complexName;
        if (firstName) {
            n.push(firstName);
        }
        if (middleName) {
            n.push(middleName);
        }
        if (lastName) {
            n.push(lastName);
        }
        return n.join(' ');
    }
};

async function syncDB({ redisCache, db, logger }) {
    logger.log('Syncing cache to in-memory DB');

    const parseData = (rawData) => {
        let data;
        if (typeof rawData === 'string') {
            try {
                data = JSON.parse(rawData);
            } catch (err) {
                logger.push({ err }).log('Error parsing JSON cache value');
            }
        }

        if (data.direction === 'INBOUND') {
            if (data.quoteResponse?.body) {
                data.quoteResponse.body = JSON.parse(data.quoteResponse.body);
            }
            if (data.fulfil?.body) {
                data.fulfil.body = JSON.parse(data.fulfil.body);
            }
        }
        return data;
    };

    const cacheKey = async (key) => {
        const rawData = await redisCache.get(key);
        const data = parseData(rawData);

        // console.log(rawData);

        // this is all a hack right now as we will eventually NOT use the cache as a source
        // of truth for transfers but rather some sort of dedicated persistence service instead.
        // Therefore we can afford to do some nasty things in order to get working features...
        // for now...

        const initiatedTimestamp = data.initiatedTimestamp
            ? new Date(data.initiatedTimestamp).getTime()
            : null;
        const completedTimestamp = data.fulfil
            ? new Date(data.fulfil.body.completedTimestamp).getTime()
            : null;

        // the cache data model for inbound transfers is lacking some properties that make it easy to extract
        // certain information...therefore we have to find it elsewhere...

        if (!['INBOUND', 'OUTBOUND'].includes(data.direction))
            logger
                .push({ data })
                .log('Unable to process row. No direction property found');

        const row = {
            id: data.transferId,
            redis_key: key, // To be used instead of Transfer.cachedKeys
            raw: JSON.stringify(data),
            created_at: initiatedTimestamp,
            completed_at: completedTimestamp,
            ...(data.direction === 'INBOUND' && {
                sender: getPartyNameFromQuoteRequest(data.quoteRequest, 'payer'),
                sender_id_type:
                  data.quoteRequest?.body?.payer?.partyIdInfo?.partyIdType,
                sender_id_sub_value:
                  data.quoteRequest?.body?.payer?.partyIdInfo?.partySubIdOrType,
                sender_id_value:
                  data.quoteRequest?.body?.payer?.partyIdInfo?.partyIdentifier,
                recipient: getPartyNameFromQuoteRequest(data.quoteRequest, 'payee'),
                recipient_id_type:
                  data.quoteRequest?.body?.payee?.partyIdInfo?.partyIdType,
                recipient_id_sub_value:
                  data.quoteRequest?.body?.payee?.partyIdInfo?.partySubIdOrType,
                recipient_id_value:
                  data.quoteRequest?.body?.payee?.partyIdInfo?.partyIdentifier,
                amount: data.quoteResponse?.body?.transferAmount.amount,
                currency: data.quoteResponse?.body?.transferAmount.currency,
                direction: -1,
                batch_id: '',
                details: data.quoteRequest?.body?.note,
                dfsp: data.quoteRequest?.body?.payer?.partyIdInfo.fspId,
                success: getInboundTransferStatus(data),
                supported_currencies: JSON.stringify(data.supportedCurrencies),
            }),
            ...(data.direction === 'OUTBOUND' && {
                sender: getName(data.from),
                sender_id_type: data.from?.idType,
                sender_id_sub_value: data.from?.idSubType,
                sender_id_value: data.from?.idValue,
                recipient: getName(data.to),
                recipient_id_type: data.to?.idType,
                recipient_id_sub_value: data.to?.idSubType,
                recipient_id_value: data.to?.idValue,
                amount: data.amount,
                currency: data.currency,
                direction: 1,
                batch_id: '', // TODO: Implement
                details: data.note,
                dfsp: data.to?.fspId,
                success: getTransferStatus(data),
                supported_currencies: JSON.stringify(data.supportedCurrencies),
            }),
        };

        // check if there is a key in the data object named fxQuoteResponse
        let fx_quote_row = null;
        if (data.fxQuoteResponse) {

            fx_quote_row = {
                id: data.transferId,
                redis_key: key, // To be used instead of Transfer.cachedKeys
                raw: JSON.stringify(data),
                created_at: initiatedTimestamp,
                // completed_at: data.completedTimestamp,
                ...(data.direction === 'INBOUND' && {
                    conversion_id: data.fxQuoteResponse.body.conversionTerms.conversionId,
                    initiating_fsp: data.fxQuoteResponse.body.conversionTerms.initiatingFsp,
                    counter_party_fsp: data.fxQuoteResponse.body.conversionTerms.counterPartyFsp,
                    amount_type: data.fxQuoteResponse.body.conversionTerms.amountType,
                    source_amount: data.fxQuoteResponse.body.conversionTerms.sourceAmount.amount,
                    source_currency: data.fxQuoteResponse.body.conversionTerms.sourceAmount.currency,
                    target_amount: data.fxQuoteResponse.body.conversionTerms.targetAmount.amount,
                    target_currency: data.fxQuoteResponse.body.conversionTerms.targetAmount.currency,
                    expiration: data.fxQuoteResponse.body.conversionTerms.expiration,
                }),
                ...(data.direction === 'OUTBOUND' && {
                    conversion_id: data.fxQuoteResponse.body.conversionTerms.conversionId,
                    initiating_fsp: data.fxQuoteResponse.body.conversionTerms.initiatingFsp,
                    counter_party_fsp: data.fxQuoteResponse.body.conversionTerms.counterPartyFsp,
                    amount_type: data.fxQuoteResponse.body.conversionTerms.amountType,
                    source_amount: data.fxQuoteResponse.body.conversionTerms.sourceAmount.amount,
                    source_currency: data.fxQuoteResponse.body.conversionTerms.sourceAmount.currency,
                    target_amount: data.fxQuoteResponse.body.conversionTerms.targetAmount.amount,
                    target_currency: data.fxQuoteResponse.body.conversionTerms.targetAmount.currency,
                    expiration: data.fxQuoteResponse.body.conversionTerms.expiration
                }),
            };
        } else {
            // code to handle when fxQuoteResponse key does not exist
            logger.log('fxQuoteResponse key does not exist');
        }

        let fx_transfer_row = null;
        if (data.fxTransferRequest && data.fxTransferResponse) {
            logger.log(`The fxTransferRequest body is ${data.fxTransferRequest.body}`);
            const fxTransferRequestData = parseData(data.fxTransferRequest.body);
            fx_transfer_row = {
                created_at: initiatedTimestamp,
                ...(data.direction === 'INBOUND' && {
                    initiating_fsp: fxTransferRequestData.initiatingFsp,
                    counter_party_fsp: fxTransferRequestData.counterPartyFsp,
                    amount_type: fxTransferRequestData.amountType,
                    source_amount: fxTransferRequestData.sourceAmount.amount,
                    source_currency: fxTransferRequestData.sourceAmount.currency,
                    target_amount: fxTransferRequestData.targetAmount.amount,
                    target_currency: fxTransferRequestData.targetAmount.currency,
                    expiration: fxTransferRequestData.expiration,
                    determining_transfer_id: fxTransferRequestData.determiningTransferId,
                    condition: fxTransferRequestData.condition,
                    commit_request_id: fxTransferRequestData.commitRequestId,
                    conversion_state: data.fxTransferResponse.body.conversionState,
                    completed_timestamp: data.fxTransferResponse.body.completedTimestamp,
                    fulfilment: data.fxTransferResponse.body.fulfilment,
                }),
                ...(data.direction === 'OUTBOUND' && {
                    initiating_fsp: fxTransferRequestData.initiatingFsp,
                    counter_party_fsp: fxTransferRequestData.counterPartyFsp,
                    amount_type: fxTransferRequestData.amountType,
                    source_amount: fxTransferRequestData.sourceAmount.amount,
                    source_currency: fxTransferRequestData.sourceAmount.currency,
                    target_amount: fxTransferRequestData.targetAmount.amount,
                    target_currency: fxTransferRequestData.targetAmount.currency,
                    expiration: fxTransferRequestData.expiration,
                    determining_transfer_id: fxTransferRequestData.determiningTransferId,
                    condition: fxTransferRequestData.condition,
                    commit_request_id: fxTransferRequestData.commitRequestId,
                    conversion_state: data.fxTransferResponse.body.conversionState,
                    completed_timestamp: data.fxTransferResponse.body.completedTimestamp,
                    fulfilment: data.fxTransferResponse.body.fulfilment,
                }),
            };

            logger.log(`fxTransferResponse body is ${data.fxTransferResponse.body}`);
        } else {
            // code to handle when fxQuoteResponse key does not exist
            logger.log('fxTransferRequest or fxTransferResponse key does not exist');
        }


        // logger.push({ data }).log('processing cache item');

        // logger.push({ ...row, raw: ''}).log('Row processed');

        const keyIndex = cachedPendingKeys.indexOf(row.id);
        if (keyIndex === -1) {
            await db('transfer').insert(row);
            if(fx_quote_row != undefined && fx_quote_row != null) {
                await db('fx_quote').insert(fx_quote_row);
            }
            if(fx_transfer_row != undefined && fx_transfer_row != null) {
                await db('fx_transfer').insert(fx_transfer_row);
            }
            cachedPendingKeys.push(row.id);
        } else {
            await db('transfer').where({ id: row.id }).update(row);
            if(fx_quote_row != null && fx_quote_row != undefined) {
                try {
                    await db('fx_quote').update(fx_quote_row);
                } catch (err) {
                    console.log(err);
                }
            }
            if(fx_transfer_row != undefined && fx_transfer_row != null) {
                try {
                    await db('fx_transfer').update(fx_transfer_row);
                } catch (err) {
                    console.log(err);
                }
            }
            // cachedPendingKeys.splice(keyIndex, 1);
        }

        if (row.success !== null) {
            cachedFulfilledKeys.push(key);
        }

    // const sqlRaw = db('transfer').insert(row).toString();
    // db.raw(sqlRaw.replace(/^insert/i, 'insert or ignore')).then(resolve);
    };

    const keys = await redisCache.keys('transferModel_*');
    const uncachedOrPendingKeys = keys.filter(
        (x) => cachedFulfilledKeys.indexOf(x) === -1,
    );
    await Promise.all(uncachedOrPendingKeys.map(cacheKey));
    // logger.log('In-memory DB sync complete');
}

const createMemoryCache = async (config) => {
    const knexConfig = {
        client: 'better-sqlite3',
        connection: {
            filename: ':memory:',
        },
        useNullAsDefault: true,
    };

    const db = knex(knexConfig);

    Object.defineProperty(
        db,
        'createTransaction',
        async () => new Promise((resolve) => db.transaction(resolve)),
    );

    await db.migrate.latest({ directory: `${__dirname}/migrations` });


    const redisCache = new Cache(config);
    await redisCache.connect();

    const doSyncDB = () =>
        syncDB({
            redisCache,
            db,
            logger: config.logger,
        });

    if (!config.manualSync) {
        await doSyncDB();
        const interval = setInterval(doSyncDB, (config.syncInterval || 60) * 1e3);
        db.stopSync = () => clearInterval(interval);
    } else {
        db.sync = doSyncDB;
    }
    db.redisCache = () => redisCache; // for testing purposes

    return db;
};

module.exports = {
    createMemoryCache
};
