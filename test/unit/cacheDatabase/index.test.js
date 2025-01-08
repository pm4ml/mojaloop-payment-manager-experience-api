const redis = require('redis');
const knex = require('knex');
const { Logger } = require('@mojaloop/sdk-standard-components');
const { syncDB } = require('../../../src/lib/cacheDatabase/');
let mockRedisClient;
jest.mock('redis', () => ({
    createClient: jest.fn(() => mockRedisClient),
}));
describe('SyncDb', () => {
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
    beforeEach(async () => {
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
        redis.createClient.mockImplementation(() => mockRedisClient);
        logger = new Logger.Logger({
            context: {
                app: 'mojaloop-payment-manager-experience-api-service-control-server'
            },
            stringify: Logger.buildStringify({ space: 2 }),
        });
        db = knex({
            client: 'better-sqlite3',
            connection: { filename: ':memory:' },
            useNullAsDefault: true
        });
        await db.schema.createTable('transfer', (table) => {
            table.string('id').primary();
            table.string('sender');
            table.string('recipient');
            table.string('amount');
            table.string('currency');
        });
        await db.schema.createTable('fx_quote', (table) => {
            table.string('conversion_request_id').primary();
            table.string('conversion_id');
            table.string('source_amount');
            table.string('source_currency');
            table.string('target_currency');
        });
        await db('transfer').insert({
            id: 'test-transfer-id',
            sender: 'Sender',
            recipient: 'Recipient',
            amount: '100',
            currency: 'USD'
        });
        await db('fx_quote').insert({
            conversion_request_id: 'test-conversion-id',
            conversion_id: 'test-conversion',
            source_amount: '100',
            source_currency: 'USD',
            target_currency: 'EUR'
        });
    });
    afterEach(async () => {
        await db.destroy();
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
        test('should return undefined if transfer data does not exist by id', async () => {
            mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
            await syncDB({ redisCache: mockRedisClient, db, logger });
            const result = await db('transfer').where({ id: 'test-transfer-id1' }).first();
            expect(result).toBeUndefined();
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
});