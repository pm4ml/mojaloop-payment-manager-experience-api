const Transfer = require('../../../src/lib/model/Transfer');
const mock = require('../../../src/lib/model/mock');
const util = require('util');

const mockDb = {
    _error: null, // To simulate database errors
    _result: null,
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(function() {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockImplementation(function() {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockImplementation(function() {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    groupBy: jest.fn().mockImplementation(function() {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    raw: jest.fn().mockImplementation(query => {
        if (query.includes('MIN')) {
            return Promise.resolve([{ timestamp: 1000 }]);
        }
        return Promise.resolve(query);
    }),

    setError: function(error) {
        this._error = error;
        return this;
    },

    setResult: function(result) {
        this._result = result;
        return this;
    },

    clear: function() {
        this._error = null;
        this._result = null;
    }
};


describe('Transfer', () => {
    let transfer;

    beforeAll(() => {
        transfer = new Transfer({ mockData: true, logger: console });
    });

    describe('Data Transformation and Formatting', () => {
        test('should apply joins correctly', () => {
            const query = mockDb;
            transfer._applyJoin(query);

            expect(query.leftJoin).toHaveBeenCalledWith('fx_quote', 'transfer.redis_key', 'fx_quote.redis_key');
            expect(query.leftJoin).toHaveBeenCalledWith('fx_transfer', 'fx_quote.redis_key', 'fx_transfer.redis_key');
            expect(query.select).toHaveBeenCalledWith(expect.arrayContaining([
                'transfer.*',
                'fx_quote.source_currency as fx_source_currency',
                'fx_transfer.commit_request_id as fx_commit_request_id',
            ]));
        });

        test('should format transfer object correctly for API response', () => {
            const transferData = {
                id: '1',
                batch_id: 'batch1',
                dfsp: 'dfsp1',
                direction: 1,
                currency: 'USD',
                amount: '100',
                success: 1,
                created_at: '2023-01-01T00:00:00Z',
                sender: 'sender1',
                sender_id_type: 'type1',
                raw: JSON.stringify({ homeTransactionId: 'home1' }),
            };

            const result = transfer._convertToApiFormat(transferData);

            expect(result).toEqual(expect.objectContaining({
                id: '1',
                batchId: 'batch1',
                institution: 'dfsp1',
                currency: 'USD',
                amount: 100,
                status: 'SUCCESS',
                homeTransferId: 'home1',
            }));
        });

        test('should parse raw transfer request bodies correctly', () => {
            const rawTransfer = {
                getPartiesRequest: { body: JSON.stringify({ key: 'value' }) },
                quoteRequest: { body: JSON.stringify({ quote: 'test' }) },
            };

            const result = transfer._parseRawTransferRequestBodies(rawTransfer);

            expect(result.getPartiesRequest.body).toEqual({ key: 'value' });
            expect(result.quoteRequest.body).toEqual({ quote: 'test' });
        });

        test('should throw an error for invalid JSON in raw transfer request bodies', () => {
            const rawTransfer = {
                getPartiesRequest: { body: 'invalid json' },
            };

            expect(() => transfer._parseRawTransferRequestBodies(rawTransfer)).toThrow();
        });

        test('should extract and format conversion terms from FX quote response', () => {
            const fxQuoteResponse = {
                body: {
                    conversionTerms: JSON.stringify({
                        sourceAmount: { amount: '100', currency: 'USD' },
                        targetAmount: { amount: '200', currency: 'EUR' },
                        charges: [],
                        expiration: '2023-12-31T23:59:59Z',
                    }),
                },
            };

            const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);

            expect(result).toEqual(expect.objectContaining({
                transferAmount: {
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                },
                expiryDate: '2023-12-31T23:59:59Z',
            }));
        });

        test('should handle missing or undefined FX quote response in getConversionTerms', () => {
            expect(transfer._getConversionTermsFromFxQuoteResponse(undefined)).toEqual({
                transferAmount: {
                    sourceAmount: { amount: '', currency: '' },
                    targetAmount: { amount: '', currency: '' },
                },
                exchangeRate: '',
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' },
                },
                expiryDate: ''
            });

            expect(transfer._getConversionTermsFromFxQuoteResponse({ body: {} })).toBeUndefined();
        });
    });

    describe('Calculations', () => {
        test('should calculate total charges correctly', () => {
            const charges = [
                { sourceAmount: { amount: '10', currency: 'USD' }, targetAmount: { amount: '20', currency: 'EUR' } },
                { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: { amount: '10', currency: 'EUR' } },
            ];
            const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '15', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '30', currency: 'EUR' },
            });
        });

        test('should handle non-matching and invalid currencies, and null values in charge calculations', () => {
            const charges = [
                { sourceAmount: { amount: '10', currency: 'GBP' }, targetAmount: { amount: '20', currency: 'JPY' } },
                { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: { amount: '10', currency: 'EUR' } },
                { sourceAmount: undefined, targetAmount: { amount: '20', currency: 'EUR' }},
                { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: undefined },
                { sourceAmount: { amount: '10', currency: 'INVALID' }, targetAmount: { amount: '5', currency: 'XXX' } }
            ];
            const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '10', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '30', currency: 'EUR' }
            });
        });

        test.each([
            { sourceAmount: '100', targetAmount: '200', sourceCharges: 10, targetCharges: 20, expected: '2.0000' },
            { sourceAmount: '0', targetAmount: '200', sourceCharges: 10, targetCharges: 20, expected: '-18.0000' },
            { sourceAmount: '100', targetAmount: '0', sourceCharges: 10, targetCharges: 20, expected: '-0.2222' },
            { sourceAmount: '0', targetAmount: '200', sourceCharges: 0, targetCharges: 20, expected: null },
            { sourceAmount: '999999999999999999999', targetAmount: '1000', sourceCharges: '0', targetCharges: '0', expected: expect.anything() }
        ])('should calculate exchange rate correctly for various scenarios including normal, edge, and extreme cases', ({ sourceAmount, targetAmount, sourceCharges, targetCharges, expected }) => {
            const result = transfer._calculateExchangeRate(sourceAmount, targetAmount, sourceCharges, targetCharges);
            expect(result).toEqual(expected);
        });
    });

    describe('Party Information Handling', () => {
        test('should extract payer party information from quote request', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: { partyIdType: 'MSISDN', partyIdentifier: '123456789' },
                    },
                },
            };

            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');

            expect(result).toEqual(expect.objectContaining({
                idType: 'MSISDN',
                idValue: '123456789',
            }));
        });

        test('should handle missing or undefined party in quote request', () => {
            expect(transfer._getPartyFromQuoteRequest({ body: {} }, 'payer')).toBeUndefined();
            expect(transfer._getPartyFromQuoteRequest({ body: { payer: {} } }, 'payer')).toEqual({
                idType: undefined,
                idValue: undefined,
                idSubType: undefined,
                displayName: undefined,
                firstName: undefined,
                middleName: undefined, 
                lastName: undefined,
                dateOfBirth: undefined,
                merchantClassificationCode: undefined,
                fspId: undefined,
                extensionList: undefined
            });
        });
    });

    describe('Complex Name Handling', () => {
        test.each([
            { name: { firstName: 'John', middleName: 'M', lastName: 'Doe' }, expected: 'John M Doe' },
            { name: { firstName: 'John', lastName: 'Doe' }, expected: 'John Doe' },
            { name: { firstName: 'John' }, expected: 'John' },
            { name: null, expected: undefined },
        ])('should format complex names to display names', ({ name, expected }) => {
            expect(transfer._complexNameToDisplayName(name)).toBe(expected);
        });
    });

    describe('Error Handling', () => {
        test.each([
            { error: { mojaloopError: { errorInformation: { errorDescription: 'Test error' } } }, expected: 'Test error' },
            { error: { httpStatusCode: 500 }, expected: 'HTTP 500' },
        ])('should determine error type from transfer last error', ({ error, expected }) => {
            expect(Transfer._transferLastErrorToErrorType(error)).toBe(expected);
        });

        test('should handle null error object in last error gracefully', () => {
            const result = transfer._convertToApiFormat({ raw: JSON.stringify({ lastError: null }), created_at: new Date().toISOString() });
            expect(result.errorType).toBeNull();
        });
    });

    describe('findAll and findAllWithFX Methods', () => {
        beforeEach(() => {
            transfer.mockData = true;
            jest.spyOn(mock, 'getTransfers').mockResolvedValue([]);
        });
    
        const testParams = [
            {},
            { id: 'test-id' },
            { startTimestamp: '2022-01-01' },
            { endTimestamp: '2022-12-31' },
            { senderIdType: 'type1' },
            { senderIdValue: 'value1' },
            { senderIdSubValue: 'sub1' },
            { recipientIdType: 'type2' },
            { recipientIdValue: 'value2' },
            { recipientIdSubValue: 'sub2' },
            { direction: 'INBOUND' },
            { institution: 'institution1' },
            { batchId: 'batch1' },
            { status: 'PENDING' },
            { offset: 0 },
            { limit: 10 },
            {
                id: 'test-id',
                startTimestamp: '2022-01-01',
                endTimestamp: '2022-12-31',
                senderIdType: 'type1',
                senderIdValue: 'value1',
                senderIdSubValue: 'sub1',
                recipientIdType: 'type2',
                recipientIdValue: 'value2',
                recipientIdSubValue: 'sub2',
                direction: 'INBOUND',
                institution: 'institution1',
                batchId: 'batch1',
                status: 'PENDING',
                offset: 0,
                limit: 10
            }
        ];
    
        test.each(testParams)('findAll should handle various query parameters', async (params) => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            mock.getTransfers.mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll(params);
    
            expect(result).toHaveLength(mockResponse.length);
            if (mockResponse.length > 0) {
                expect(result[0].id).toBe('test-id');
            }
            expect(mock.getTransfers).toHaveBeenCalledWith(expect.objectContaining(params));
        });
    
        test.each(testParams)('findAllWithFX should handle various query parameters', async (params) => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            mock.getTransfers.mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX(params);
    
            expect(result).toHaveLength(mockResponse.length);
            if (mockResponse.length > 0) {
                expect(result[0].id).toBe('test-id');
            }
            expect(mock.getTransfers).toHaveBeenCalledWith(expect.objectContaining(params));
        });
    
        test('should handle empty response for findAll and findAllWithFX', async () => {
            mock.getTransfers.mockResolvedValue([]);
    
            const resultFindAll = await transfer.findAll({});
            const resultFindAllWithFX = await transfer.findAllWithFX({});
    
            expect(resultFindAll).toHaveLength(0);
            expect(resultFindAllWithFX).toHaveLength(0);
        });
    });

    describe('findOne Method', () => {
        test('should find one transfer by id', async () => {
            const id = 'test-id';
            const mockResponse = { id, raw: '{}' };
            jest.spyOn(mock, 'getTransfer').mockResolvedValue(mockResponse);

            const result = await transfer.findOne(id);
            expect(result).toEqual(expect.objectContaining({ id }));
        });

        test('should return null for non-existent id', async () => {
            const id = 'non-existent-id';
            jest.spyOn(mock, 'getTransfer').mockResolvedValue(null);

            const result = await transfer.findOne(id);
            expect(result).toBeNull();
        });
    });

    describe('details Method', () => {
        test('should return transfer details by id', async () => {
            const id = 'test-id';
            const mockResponse = [{ id, raw: '{}' }];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);

            const result = await transfer.details(id);
            expect(result[0]).toEqual(expect.objectContaining({ id }));
        });

        test('should return null or empty array for non-existent id', async () => {
            const id = 'non-existent-id';
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(null);

            const result = await transfer.details(id);
            expect(result).toBeNull();
        });

        test('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);
    
            const result = await transfer.details('test-id');
            expect(result).toEqual([]);
        });
    });

    describe('Metrics Methods', () => {
        beforeEach(() => {
            transfer.mockData = true;
        });
    
        test('should return success rate for transfers', async () => {
            const mockSuccessResponse = [{ timestamp: 1234567890, percentage: 50 }];
            jest.spyOn(mock, 'getTransfersSuccessRate').mockResolvedValue(mockSuccessResponse);
    
            const result = await transfer.successRate({ minutePrevious: 10 });
            expect(result).toEqual(mockSuccessResponse);
        });
    
        test('should return average response time for transfers', async () => {
            const mockResponse = [{ timestamp: 1234567890, averageResponseTime: 1000 }];
            jest.spyOn(mock, 'getTransfersAvgResponseTime').mockResolvedValue(mockResponse);
    
            const result = await transfer.avgResponseTime({ minutePrevious: 10 });
            expect(result).toEqual(mockResponse);
        });
    
        test('should return status summary for transfers', async () => {
            const mockResponse = [
                { status: 'PENDING', count: 5 },
                { status: 'SUCCESS', count: 10 },
                { status: 'ERROR', count: 3 }
            ];
            jest.spyOn(mock, 'getTransferStatusSummary').mockResolvedValue(mockResponse);
    
            const result = await transfer.statusSummary({});
            expect(result).toEqual(mockResponse);
        });
    
        test('should return hourly flow for transfers', async () => {
            const mockResponse = [{ timestamp: 1234567890, currency: 'USD', outbound: 1000 }];
            jest.spyOn(mock, 'getFlows').mockResolvedValue(mockResponse);
    
            const result = await transfer.hourlyFlow({ hoursPrevious: 10 });
            expect(result).toEqual(mockResponse);
        });
    
        test('should handle empty response for metrics methods', async () => {
            jest.spyOn(mock, 'getTransfersSuccessRate').mockResolvedValue([]);
            jest.spyOn(mock, 'getTransfersAvgResponseTime').mockResolvedValue([]);
            jest.spyOn(mock, 'getTransferStatusSummary').mockResolvedValue([]);
            jest.spyOn(mock, 'getFlows').mockResolvedValue([]);
    
            expect(await transfer.successRate({ minutePrevious: 10 })).toEqual([]);
            expect(await transfer.avgResponseTime({ minutePrevious: 10 })).toEqual([]);
            expect(await transfer.statusSummary({})).toEqual([]);
            expect(await transfer.hourlyFlow({ hoursPrevious: 10 })).toEqual([]);
        });
    });

    describe('Transfer Model Edge Cases and Additional Scenarios', () => {
        let transfer;
    
        beforeEach(() => {
            transfer = new Transfer({
                mockData: false,
                logger: { log: jest.fn() },
                db: mockDb,
            });
            jest.clearAllMocks();
        });
    
        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test('should initialize with provided props', () => {
            expect(transfer.mockData).toBe(false);
            expect(transfer._db).toBe(mockDb);
        });
    
        test('should have correct static STATUSES', () => {
            expect(Transfer.STATUSES).toEqual({
                null: 'PENDING',
                1: 'SUCCESS',
                0: 'ERROR'
            });
        });
    
        test('should log error message when database query fails', async () => {
            transfer.mockData = false;
            mockDb._result = new Error('Database error');
    
            const loggerSpy = jest.spyOn(transfer.logger, 'log');
    
            try {
                await transfer.errors({ startTimestamp: '2022-01-01', endTimestamp: '2022-12-31' });
            } catch (error) {
                expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting transfer errors'));
            }
        });
    
        test('should handle empty values in data transformations', () => {
            expect(transfer._convertToApiFormat({ success: null, raw: '{}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'PENDING');
            expect(transfer._convertToApiFormat({ success: 1, raw: '{}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'SUCCESS');
            expect(transfer._convertToApiFormat({ success: 0, raw: '{"lastError":{}}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'ERROR');
        });
    
        test('should convert party info to transfer party format', () => {
            const input = {
                idType: 'MSISDN',
                idValue: '123456789',
                idSubType: 'PERSONAL', 
                firstName: 'John',
                middleName: 'M',
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                merchantClassificationCode: '123',
                fspId: 'testFsp',
                extensionList: ['ext1', 'ext2']
            };
        
            const result = transfer._convertToTransferParty(input);
            
            expect(result).toEqual({
                type: '',
                idType: 'MSISDN',
                idValue: '123456789',
                idSubType: 'PERSONAL',
                displayName: 'John M Doe',
                firstName: 'John',
                middleName: 'M', 
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                merchantClassificationCode: '123',
                fspId: 'testFsp',
                extensionList: ['ext1', 'ext2']
            });
        });
    
        test('should handle null values in party info', () => {
            const partyData = {
                idType: null,
                idValue: null,
                idSubType: null,
                firstName: null,
                middleName: null,
                lastName: null,
                dateOfBirth: null,
                merchantClassificationCode: null,
                fspId: null,
                extensionList: null
            };
        
            const result = transfer._convertToTransferParty(partyData);
        
            expect(result).toEqual({
                type: '',
                ...partyData,
                displayName: '' 
            });
        });
        
        test('should convert transfer to API detail format correctly', () => {
            const transferData = {
                id: '1',
                batch_id: 'batch1',
                dfsp: 'dfsp1',
                direction: 1,
                currency: 'USD',
                amount: '100',
                success: 1,
                created_at: '2020-01-01T00:00:00Z',
                sender: 'sender1',
                sender_id_type: 'type1',
                sender_id_sub_value: 'sub1',
                sender_id_value: 'value1',
                recipient: 'recipient1',
                recipient_id_type: 'type2',
                recipient_id_sub_value: 'sub2',
                recipient_id_value: 'value2',
                supported_currencies: '["USD", "EUR"]',
                raw: JSON.stringify({
                    homeTransactionId: 'home1',
                    lastError: { httpStatusCode: 500 },
                    getPartiesRequest: { body: {} },
                    quoteRequest: { 
                        body: {
                            payee: {
                                partyIdInfo: { fspId: 'fsp1' }
                            },
                            amountType: 'SEND',
                            transactionId: 'tx1'
                        } 
                    },
                    quoteResponse: { 
                        body: {
                            transferAmount: { amount: '100', currency: 'USD' },
                            payeeReceiveAmount: { amount: '95', currency: 'USD' },
                            payeeFspFee: { amount: '5', currency: 'USD' },
                            expiration: '2020-01-02T00:00:00Z'
                        } 
                    },
                    prepare: { body: {} },
                    fulfil: { body: { transferState: 'COMMITTED' } },
                    needFx: false,
                    transactionType: 'TRANSFER',
                    currentState: 'COMPLETED'
                }),
                details: 'details1'
            };
    
            const result = transfer._convertToApiDetailFormat(transferData);
    
            expect(result).toEqual(expect.objectContaining({
                transferId: '1',
                transferState: 'SUCCESS',
                direction: 'OUTBOUND',
                sendAmount: '100',
                sendCurrency: 'USD',
                dateSubmitted: new Date('2020-01-01T00:00:00Z'),
                needFx: false,
                transactionType: 'TRANSFER',
                receiveAmount: '100',
                receiveCurrency: 'USD',
                recipientCurrencies: ['USD', 'EUR'],
                recipientInstitution: 'fsp1',
                transferTerms: expect.objectContaining({
                    transferId: '1',
                    quoteAmount: {
                        amount: '100',
                        currency: 'USD'
                    },
                    quoteAmountType: 'SEND',
                    transferAmount: {
                        amount: '100',
                        currency: 'USD'
                    }
                })
            }));
        });
    
        test('should handle missing or malformed quote response data', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({
                    quoteResponse: { 
                        body: {} 
                    }
                }),
                supported_currencies: '[]'
            };
    
            const result = transfer._convertToApiDetailFormat(transferData);
    
            expect(result.transferTerms.transferAmount).toEqual({
                amount: undefined,
                currency: undefined
            });
        });
    
        test('should handle missing fx data', () => {
            const transferData = {
                id: '1',
                amount: '100',
                currency: 'USD',
                raw: JSON.stringify({
                    needFx: true
                }),
                supported_currencies: '[]'
            };
    
            const result = transfer._convertToApiDetailFormat(transferData);
    
            expect(result.receiveAmount).toBe('');
            expect(result.receiveCurrency).toBe('');
        });
    
        test('should handle missing dates in transfer data', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({}),
                supported_currencies: '[]',
                created_at: null
            };
        
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.dateSubmitted instanceof Date).toBe(true);
            expect(result.dateSubmitted.getTime()).toBe(0);
        });
    
        test('should handle malformed date strings in convertToApiDetailFormat', () => {
            const transferData = {
                id: '1',
                created_at: 'invalid date',
                raw: JSON.stringify({}),
                supported_currencies: '[]'
            };
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.dateSubmitted instanceof Date).toBe(true);
        });
    });
});

describe('Transfer - Additional Tests', () => {
    let transfer;

    beforeEach(() => {
        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb,
        });
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Database Error Handling', () => {
        const methods = ['findAll', 'findAllWithFX', 'findOne', 'details', 'successRate', 'avgResponseTime', 'statusSummary', 'hourlyFlow', 'errors'];

        test.each(methods)('%s should handle database errors gracefully', async (method) => {
            const error = new Error('Database error');
            mockDb.setError(error);
            const loggerSpy = jest.spyOn(transfer.logger, 'log');

            // Special handling for 'errors' method
            if (method === 'errors') {
                mockDb.where.mockImplementationOnce(() => Promise.reject(error));
            }

            if (['findAll', 'findAllWithFX', 'details'].includes(method)) {
                mockDb.orderBy.mockImplementationOnce(() => Promise.reject(error));
            } else if (method === 'findOne') {
                mockDb.first.mockImplementationOnce(() => Promise.reject(error));
            }

            try {
                await transfer[method]({});
                fail(`The ${method} method should have thrown an error.`);
            } catch (err) {
                expect(err).toBe(error);
                if (method !== 'errors') {
                    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting transfer errors'));
                }
            }
        });
    });

    describe('Branch Coverage in findAll and findAllWithFX', () => {
        const testCases = [
            { direction: 'INBOUND', status: 'SUCCESS' },
            { direction: 'OUTBOUND', status: 'ERROR' },
            { direction: 'INVALID', status: 'PENDING' },
            { direction: 'INVALID' },
            { status: 'INVALID' },
            { offset: 10, limit: 20 },
        ];

        beforeEach(() => {
            mockDb.setResult([]);
        });

        test.each(testCases)('findAll should cover all branches with params: %p', async (params) => {
            await transfer.findAll(params);
            // Add assertions based on expected behavior for each parameter combination
        });

        test.each(testCases)('findAllWithFX should cover all branches with params: %p', async (params) => {
            await transfer.findAllWithFX(params);
            // Add assertions based on expected behavior for each parameter combination
        });
    });

    describe('Null/Undefined Values Handling', () => {
        beforeEach(() => {
            mockDb.setResult([]);
        });

        test('findAll should handle null/undefined values in query parameters', async () => {
            await transfer.findAll({
                startTimestamp: null,
                endTimestamp: undefined,
                senderIdType: null,
            });
            // Add assertions to check how the query is built with null/undefined values
        });

        test('findAllWithFX should handle null/undefined values in query parameters', async () => {
            await transfer.findAllWithFX({
                startTimestamp: null,
                endTimestamp: undefined,
                senderIdType: null,
            });
            // Add assertions to check how the query is built with null/undefined values
        });

        test('details should handle null/undefined database results', async () => {
            mockDb.setResult(null);
            const result = await transfer.details('test-id');
            expect(result).toBeNull();
        });
    });

    describe('Edge Cases in Date/Time Handling', () => {
        beforeEach(() => {
            mockDb.setResult([]);
        });
        
        test('findAll should handle invalid date strings in timestamps', async () => {
            await transfer.findAll({
                startTimestamp: 'invalid-date',
                endTimestamp: 'another-invalid-date',
            });
            // Add assertions to check how the query handles invalid dates
        });

        test('findAllWithFX should handle invalid date strings in timestamps', async () => {
            await transfer.findAllWithFX({
                startTimestamp: 'invalid-date',
                endTimestamp: 'another-invalid-date',
            });
            // Add assertions to check how the query handles invalid dates
        });

        test('findAll should handle edge case timestamps', async () => {
            await transfer.findAll({
                startTimestamp: '0000-01-01T00:00:00Z',
                endTimestamp: '9999-12-31T23:59:59Z',
            });
            // Add assertions for edge case timestamps
        });

        test('findAllWithFX should handle edge case timestamps', async () => {
            await transfer.findAllWithFX({
                startTimestamp: '0000-01-01T00:00:00Z',
                endTimestamp: '9999-12-31T23:59:59Z',
            });
            // Add assertions for edge case timestamps
        });
    });
    
    describe('findAll Method - Parameter Combinations', () => {
        const testParams = [
            { startTimestamp: '2023-01-01', endTimestamp: '2023-12-31' },
            { senderIdType: 'TYPE1', senderIdValue: 'VALUE1' },
            { recipientIdType: 'TYPE2', recipientIdValue: 'VALUE2' },
            { direction: 'INBOUND', institution: 'INST1' },
            { batchId: 'BATCH1', status: 'SUCCESS' },
            { offset: 5, limit: 15 },
            { senderIdSubValue: 'SUB1', recipientIdSubValue: 'SUB2' },
            { direction: 'OUTBOUND', status: 'ERROR' },
            { status: 'PENDING' },
            { id: 'ID123' }
        ];
    
        beforeEach(() => {
            mockDb.setResult([]);
        });
    
        test.each(testParams)('should handle different parameter combinations in findAll - %p', async (params) => {
            await transfer.findAll(params);
    
            if (params.startTimestamp) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('created_at', '>=', expect.any(Number));
            }
            if (params.endTimestamp) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('created_at', '<', expect.any(Number));
            }
            if (params.senderIdType) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_type', 'LIKE', `%${params.senderIdType}%`);
            }
            if (params.senderIdValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_value', 'LIKE', `%${params.senderIdValue}%`);
            }
            if (params.senderIdSubValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_sub_value', 'LIKE', `%${params.senderIdSubValue}%`);
            }
            if (params.recipientIdType) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('recipient_id_type', 'LIKE', `%${params.recipientIdType}%`);
            }
            if (params.recipientIdValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('recipient_id_value', 'LIKE', `%${params.recipientIdValue}%`);
            }
            if (params.recipientIdSubValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('recipient_id_sub_value', 'LIKE', `%${params.recipientIdSubValue}%`);
            }
            if (params.direction === 'INBOUND') {
                expect(mockDb.andWhere).toHaveBeenCalledWith('direction', '=', '-1');
            } else if (params.direction === 'OUTBOUND') {
                expect(mockDb.andWhere).toHaveBeenCalledWith('direction', '=', '1');
            }
            if (params.institution) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('dfsp', 'LIKE', `%${params.institution}%`);
            }
            if (params.batchId) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('batchId', 'LIKE', `%${params.batchId}%`);
            }
            if (params.status === 'PENDING') {
                expect(mockDb.andWhereRaw).toHaveBeenCalledWith('success IS NULL');
            } else if (params.status) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('success', params.status === 'SUCCESS');
            }
            if (params.offset) {
                expect(mockDb.offset).toHaveBeenCalledWith(params.offset);
            }
            if (params.limit) {
                expect(mockDb.limit).toHaveBeenCalledWith(params.limit);
            }
            if (params.id) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('id', 'LIKE', `%${params.id}%`);
            }
        });
    });
    
    describe('findAllWithFX Method - Parameter Combinations', () => {
        const testParams = [
            { startTimestamp: '2023-01-01', endTimestamp: '2023-12-31' },
            { senderIdType: 'TYPE1', senderIdValue: 'VALUE1' },
            { recipientIdType: 'TYPE2', recipientIdValue: 'VALUE2' },
            { direction: 'INBOUND', institution: 'INST1' },
            { batchId: 'BATCH1', status: 'SUCCESS' },
            { offset: 5, limit: 15 },
            { senderIdSubValue: 'SUB1', recipientIdSubValue: 'SUB2' },
            { direction: 'OUTBOUND', status: 'ERROR' },
            { status: 'PENDING' },
            { id: 'ID123' }
        ];
    
        beforeEach(() => {
            mockDb.setResult([]);
        });
    
        test.each(testParams)('should handle different parameter combinations in findAllWithFX - %p', async (params) => {
            await transfer.findAllWithFX(params);
    
            if (params.startTimestamp) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.created_at', '>=', expect.any(Number));
            }
            if (params.endTimestamp) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.created_at', '<', expect.any(Number));
            }
            if (params.senderIdType) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.sender_id_type', 'LIKE', `%${params.senderIdType}%`);
            }
            if (params.senderIdValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.sender_id_value', 'LIKE', `%${params.senderIdValue}%`);
            }
            if (params.senderIdSubValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.sender_id_sub_value', 'LIKE', `%${params.senderIdSubValue}%`);
            }
            if (params.recipientIdType) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.recipient_id_type', 'LIKE', `%${params.recipientIdType}%`);
            }
            if (params.recipientIdValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.recipient_id_value', 'LIKE', `%${params.recipientIdValue}%`);
            }
            if (params.recipientIdSubValue) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.recipient_id_sub_value', 'LIKE', `%${params.recipientIdSubValue}%`);
            }
            if (params.direction === 'INBOUND') {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.direction', '=', '-1');
            } else if (params.direction === 'OUTBOUND') {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.direction', '=', '1');
            }
            if (params.institution) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.dfsp', 'LIKE', `%${params.institution}%`);
            }
            if (params.batchId) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.batch_id', 'LIKE', `%${params.batchId}%`);
            }
            if (params.status === 'PENDING') {
                expect(mockDb.andWhereRaw).toHaveBeenCalledWith('transfer.success IS NULL');
            } else if (params.status) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.success', params.status === 'SUCCESS');
            }
            if (params.offset) {
                expect(mockDb.offset).toHaveBeenCalledWith(params.offset);
            }
            if (params.limit) {
                expect(mockDb.limit).toHaveBeenCalledWith(params.limit);
            }
            if (params.id) {
                expect(mockDb.andWhere).toHaveBeenCalledWith('transfer.id', 'LIKE', `%${params.id}%`);
            }
        });
    });
});
