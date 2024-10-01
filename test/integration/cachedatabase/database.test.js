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
const { addTransferToCache, createTestDb } = require('../utils');
const redisTransferData = require('../data/redisTransferData.json');
const { syncDB } = require('../../../src/lib/cacheDatabase/');


describe('Database', () => {
    describe('Integration tests', () => {
        let db;
        let logger;
        
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
    
        afterAll(async () => {
            this.db.destroy();
        });

        test('Should fetch cached Redis records', async () => {
            const redisClient = redis.createClient();
            currentTime = new Date().getTime();
            testKey = `transferModel_out_51c0d9d6-dcac-4eed-beae-4694306f71af_${currentTime}`;
            redisClient.set(testKey, redisTransferData);

            const redisValue = redisClient.get(testKey);
            expect(redisValue).toBe(redisTransferData);
            await syncDB({ redisCache: redisClient, db: this.db, logger: this.logger });

            const updatedRows = await this.db('transfer').select('id', 'success', 'amount');
            console.log(updatedRows);
            expect(updatedRows).toMatchObject([
                {
                    id: '51c0d9d6-dcac-4eed-beae-4694306f71af',
                    success: 1,
                    amount: '10'
                }
            ]);
        });
    });
});