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

const redis = require('redis');
const knex = require('knex');
const { Logger } = require('@mojaloop/sdk-standard-components');
// eslint-disable-next-line no-unused-vars
const { addTransferToCache, createTestDb } = require('../utils');
const redisTransferData = require('../data/redisTransferData.json');
const { syncDB } = require('../../../src/lib/cacheDatabase/');


describe('Database', () => {
    let db;
    // let logger;

    beforeAll(async () => {
        this.logger = new Logger.Logger({
            context: {
                app: 'mojaloop-payment-manager-experience-api-service-control-server'
            },
            stringify: Logger.buildStringify({ space: 2 }),
        });

        const knexConfig = {
            client: 'better-sqlite3',
            connection: {
                filename: ':memory:',
            },
            useNullAsDefault: true,
        };

        this.db = knex(knexConfig);

        Object.defineProperty(
            this.db,
            'createTransaction',
            async () => new Promise((resolve) => db.transaction(resolve)),
        );

        await this.db.migrate.latest({ directory: './src/lib/cacheDatabase/migrations' });
    });

    describe('Integration tests', () => {
        const redisClient = redis.createClient();
        redisClient.set('transferModel_out_05efec3c-a689-4e5d-8a78-acb2ccf8ade6', redisTransferData);

        test('Should fetch cached Redis records', async () => {
            const redisValue = redisClient.get('transferModel_out_05efec3c-a689-4e5d-8a78-acb2ccf8ade6');

            expect(redisValue).toBe(redisTransferData);

            await syncDB({ redisCache: redisClient, db: this.db, logger: this.logger });

            const updatedRows = await this.db('transfer').select('id', 'success', 'amount');
      
            expect(updatedRows).toMatchObject([
                {
                    id: '05efec3c-a689-4e5d-8a78-acb2ccf8ade6',
                    success: 1,
                    amount: '10'
                }
            ]);
        });
    });
});