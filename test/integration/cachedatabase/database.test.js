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

const redis = require('redis');
const knex = require('knex');
const { Logger } = require('@mojaloop/sdk-standard-components');
const Cache = require('../../../src/lib/cacheDatabase/cache');
const { syncDB } = require('../../../src/lib/cacheDatabase/');

jest.mock('redis');

describe('Database', () => {
    let mockRedisClient;
    let cache;
    let logger;
    let db;
    const testData = {
        key: 'test-key',
        stringValue: 'test-value',
        objectValue: { test: 'value' },
        transferData: {
            transferId: 'test-transfer-id',
            direction: 'OUTBOUND',
            currentState: 'succeeded',
            from: { 
                displayName: 'Sender',
                idType: 'MSISDN',
                idValue: '123456789'
            },
            to: {
                displayName: 'Recipient',
                idType: 'MSISDN',
                idValue: '987654321'
            },
            amount: '100',
            currency: 'USD'
        },
        fxQuoteData: {
            fxQuoteRequest: {
                body: {
                    conversionRequestId: 'test-conversion-id',
                    conversionTerms: {
                        conversionId: 'test-conversion',
                        determiningTransferId: 'test-transfer-id',
                        sourceAmount: {
                            amount: '100',
                            currency: 'USD'
                        },
                        targetAmount: {
                            currency: 'EUR'
                        }
                    }
                }
            }
        }
    };

    beforeEach(() => {
        mockRedisClient = {
            connect: jest.fn().mockResolvedValue(),
            quit: jest.fn().mockResolvedValue(),
            set: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(testData.stringValue),
            del: jest.fn().mockResolvedValue(1),
            keys: jest.fn().mockResolvedValue(['key1', 'key2']),
            on: jest.fn((event, cb) => {
                if (event === 'ready') cb();
                return mockRedisClient;
            })
        };

        redis.createClient.mockReturnValue(mockRedisClient);

        logger = new Logger.Logger({
            context: {
                app: 'mojaloop-payment-manager-experience-api-service-control-server'
            },
            stringify: Logger.buildStringify({ space: 2 }),
        });

        cache = new Cache({
            cacheUrl: 'redis://localhost:6379',
            logger
        });

        db = knex({
            client: 'better-sqlite3',
            connection: { filename: ':memory:' },
            useNullAsDefault: true
        });
    });

    afterEach(async () => {
        await db.destroy();
    });

    describe('Cache Operations', () => {
        test('should store and retrieve string value', async () => {
            await cache.connect();
            await cache.set(testData.key, testData.stringValue);
            const result = await cache.get(testData.key);
            expect(result).toBe(testData.stringValue);
        });

        test('should store and retrieve object value', async () => {
            await cache.connect();
            await cache.set(testData.key, testData.objectValue);
            expect(mockRedisClient.set).toHaveBeenCalledWith(
                testData.key, 
                JSON.stringify(testData.objectValue)
            );
        });

        test('should delete existing key', async () => {
            await cache.connect();
            await cache.del(testData.key);
            expect(mockRedisClient.del).toHaveBeenCalledWith(testData.key);
        });

        test('should maintain connection state', async () => {
            expect(cache.client).toBeNull();
            await cache.connect();
            expect(cache.client).not.toBeNull();
            await cache.disconnect();
            expect(mockRedisClient.quit).toHaveBeenCalled();
        });
    });

    describe('Helper Functions', () => {
        const getName = (userInfo) => {
            if (userInfo.displayName) {
                return userInfo.displayName;
            }
            return `${userInfo.firstName} ${userInfo.lastName}`;
        };

        const getTransferStatus = (transfer) => {
            if (transfer.currentState === 'succeeded') {
                return true;
            } else if (transfer.currentState === 'errored') {
                return false;
            } else {
                return null;
            }
        };

        test('getName should handle displayName', () => {
            const userInfo = { displayName: 'Test User' };
            expect(getName(userInfo)).toBe('Test User');
        });

        test('getName should handle firstName/lastName', () => {
            const userInfo = { firstName: 'Test', lastName: 'User' };
            expect(getName(userInfo)).toBe('Test User');
        });

        test('getTransferStatus should handle different states', () => {
            expect(getTransferStatus({ currentState: 'succeeded' })).toBe(true);
            expect(getTransferStatus({ currentState: 'errored' })).toBe(false);
            expect(getTransferStatus({ currentState: 'pending' })).toBe(null);
        });
    });

    describe('Data Processing', () => {
        test('should process transfer data correctly', async () => {
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testData.transferData));
            
            await syncDB({ redisCache: mockRedisClient, db, logger });
            
            const result = await db('transfer').where({ id: 'test-transfer-id' }).first();
            expect(result).toMatchObject({
                id: 'test-transfer-id',
                sender: 'Sender',
                recipient: 'Recipient',
                amount: '100',
                currency: 'USD'
            });
        });

        test('should process FX quote data correctly', async () => {
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testData.fxQuoteData));
            
            await syncDB({ redisCache: mockRedisClient, db, logger });
            
            const result = await db('fx_quote').where({ conversion_request_id: 'test-conversion-id' }).first();
            expect(result).toMatchObject({
                conversion_id: 'test-conversion',
                source_amount: '100',
                source_currency: 'USD'
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid JSON data', async () => {
            mockRedisClient.get.mockResolvedValue('invalid-json');
            const logSpy = jest.spyOn(logger, 'log');
            
            await syncDB({ redisCache: mockRedisClient, db, logger });
            
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Error parsing JSON'));
        });

        test('should handle missing required fields', async () => {
            const invalidData = { ...testData.transferData };
            delete invalidData.transferId;
            mockRedisClient.get.mockResolvedValue(JSON.stringify(invalidData));
            
            await syncDB({ redisCache: mockRedisClient, db, logger });
            
            const result = await db('transfer').count();
            expect(result[0]['count(*)']).toBe(0);
        });
    });
});
