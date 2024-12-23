const Transfer = require('../../../src/lib/model/Transfer');
const mock = require('../../../src/lib/model/mock');

const mockDb = {
    _result: null,
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(() => Promise.resolve(mockDb._result)),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockImplementation(() => Promise.resolve(mockDb._result)),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    raw: jest.fn().mockImplementation(query => {
        if (query.includes('MIN')) {
            return Promise.resolve([{ timestamp: 1000 }]);
        }
        return Promise.resolve(query);
    }),

    setResult: function(result) {
        this._result = result;
        return this;
    }
};

describe('Transfer Model', () => {
    let transfer;

    beforeEach(() => {
        transfer = new Transfer({
            mockData: true,
            logger: { log: jest.fn() },
            db: mockDb,
        });

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with provided props', () => {
        expect(transfer.mockData).toBe(true);
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

    test('should handle custom complex name formats', () => {
        const complexNameCases = [
            {
                input: { firstName: 'John', middleName: 'M', lastName: 'Doe' },
                expected: 'John M Doe'
            },
            {
                input: { firstName: 'John', lastName: 'Doe' },
                expected: 'John Doe'
            },
            {
                input: { firstName: 'John' },
                expected: 'John'
            },
            {
                input: null,
                expected: undefined
            }
        ];

        complexNameCases.forEach(({ input, expected }) => {
            expect(transfer._complexNameToDisplayName(input)).toBe(expected);
        });
    });

    test('should handle edge cases in transfer party conversion', () => {
        const partyData = {
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

        const result = transfer._convertToTransferParty(partyData);

        expect(result).toEqual({
            type: '',
            ...partyData,
            displayName: 'John M Doe'
        });
    });

    test('should handle edge cases in exchange rate calculation', () => {
        const testCases = [
            {
                input: { sourceAmount: '100', targetAmount: '200', sourceCharges: 10, targetCharges: 20 },
                expected: '2.0000'
            },
            {
                input: { sourceAmount: '0', targetAmount: '200', sourceCharges: 10, targetCharges: 20 },
                expected: '-18.0000'
            },
            {
                input: { sourceAmount: '100', targetAmount: '0', sourceCharges: 10, targetCharges: 20 },
                expected: '-0.2222'
            }
        ];

        testCases.forEach(({ input, expected }) => {
            const { sourceAmount, targetAmount, sourceCharges, targetCharges } = input;
            expect(transfer._calculateExchangeRate(
                sourceAmount, 
                targetAmount, 
                sourceCharges, 
                targetCharges
            )).toBe(expected);
        });
    });

    test('should parse various raw transfer request bodies', () => {
        const rawTransfer = {
            getPartiesRequest: {
                body: JSON.stringify({ party: 'test' })
            },
            quoteRequest: {
                body: JSON.stringify({ quote: 'test' })
            }
        };

        const result = transfer._parseRawTransferRequestBodies(rawTransfer);
        
        expect(result.getPartiesRequest.body).toEqual({ party: 'test' });
        expect(result.quoteRequest.body).toEqual({ quote: 'test' });

        // Test invalid JSON separately to ensure it throws
        expect(() => {
            transfer._parseRawTransferRequestBodies({
                getPartiesRequest: { body: 'invalid json' }
            });
        }).toThrow();
    });

    test('should calculate hourly flows correctly', async () => {
        transfer = new Transfer({
            mockData: true,
            logger: { log: jest.fn() },
            db: mockDb,
        });

        const mockFlowData = [{
            timestamp: 1000,
            currency: 'USD',
            inbound: 300,
            outbound: 500
        }];

        mock.getFlows = jest.fn().mockResolvedValueOnce(mockFlowData);

        const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
        
        expect(result).toEqual(mockFlowData);
    });
    
    test('should apply join correctly', () => {
        const query = mockDb;
        transfer._applyJoin(query);
        expect(query.leftJoin).toHaveBeenCalledWith('fx_quote', 'transfer.redis_key', 'fx_quote.redis_key');
        expect(query.leftJoin).toHaveBeenCalledWith('fx_transfer', 'fx_quote.redis_key', 'fx_transfer.redis_key');
        expect(query.select).toHaveBeenCalledWith([
            'transfer.*',
            'fx_quote.source_currency as fx_source_currency',
            'fx_quote.source_amount as fx_source_amount',
            'fx_quote.target_currency as fx_target_currency',
            'fx_quote.target_amount as fx_target_amount',
            'fx_transfer.source_currency as fx_transfer_source_currency',
            'fx_transfer.target_currency as fx_transfer_target_currency',
            'fx_transfer.commit_request_id as fx_commit_request_id',
        ]);
    });

    test('should convert transfer to API format correctly', () => {
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
            raw: JSON.stringify({
                homeTransactionId: 'home1',
                lastError: { httpStatusCode: 500 },
                getPartiesRequest: { body: {} },
                quoteRequest: { body: {} },
                quoteResponse: { body: {} }
            }),
            details: 'details1',
        };
        const result = transfer._convertToApiFormat(transferData);
        expect(result).toEqual({
            id: '1',
            batchId: 'batch1',
            institution: 'dfsp1',
            direction: 'OUTBOUND',
            currency: 'USD',
            amount: 100,
            type: 'P2P',
            status: 'SUCCESS',
            initiatedTimestamp: '2020-01-01T00:00:00.000Z',
            confirmationNumber: 0,
            sender: 'sender1',
            senderIdType: 'type1',
            senderIdSubValue: 'sub1',
            senderIdValue: 'value1',
            recipient: 'recipient1',
            recipientIdType: 'type2',
            recipientIdSubValue: 'sub2',
            recipientIdValue: 'value2',
            homeTransferId: 'home1',
            details: 'details1',
            errorType: null,
        });
    });

    test('should convert last error to error type correctly', () => {
        const error = { mojaloopError: { errorInformation: { errorDescription: 'error' } } };
        const result = Transfer._transferLastErrorToErrorType(error);
        expect(result).toBe('error');

        const error2 = { httpStatusCode: 500 };
        const result2 = Transfer._transferLastErrorToErrorType(error2);
        expect(result2).toBe('HTTP 500');
    });

    test('should parse raw transfer request bodies correctly', () => {
        const transferRaw = {
            getPartiesRequest: { body: '{"key":"value"}' },
            quoteRequest: { body: '{"key":"value"}' },
            quoteResponse: { body: '{"key":"value"}' },
            fxQuoteResponse: { body: '{"key":"value"}' },
            fxQuoteRequest: { body: '{"key":"value"}' },
            fxTransferRequest: { body: '{"key":"value"}' },
            fxTransferResponse: { body: '{"key":"value"}' },
            prepare: { body: '{"key":"value"}' },
            fulfil: { body: '{"key":"value"}' },
        };
        const result = transfer._parseRawTransferRequestBodies(transferRaw);
        expect(result).toEqual({
            getPartiesRequest: { body: { key: 'value' } },
            quoteRequest: { body: { key: 'value' } },
            quoteResponse: { body: { key: 'value' } },
            fxQuoteResponse: { body: { key: 'value' } },
            fxQuoteRequest: { body: { key: 'value' } },
            fxTransferRequest: { body: { key: 'value' } },
            fxTransferResponse: { body: { key: 'value' } },
            prepare: { body: { key: 'value' } },
            fulfil: { body: { key: 'value' } },
        });
    });

    test('should get conversion terms from fx quote response correctly', () => {
        const fxQuoteResponse = {
            body: {
                conversionTerms: '{"sourceAmount":{"amount":"100","currency":"USD"},"targetAmount":{"amount":"200","currency":"EUR"},"charges":[],"expiration":"2020-01-01T00:00:00Z"}',
            },
        };
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result).toEqual({
            charges: {
                totalSourceCurrencyCharges: { amount: '0', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '0', currency: 'EUR' },
            },
            expiryDate: '2020-01-01T00:00:00Z',
            transferAmount: {
                sourceAmount: { amount: '100', currency: 'USD' },
                targetAmount: { amount: '200', currency: 'EUR' },
            },
            exchangeRate: '2.0000',
        });
    });

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

    test('should calculate exchange rate correctly', () => {
        const result = transfer._calculateExchangeRate(100, 200, 10, 20);
        expect(result).toBe('2.0000');
    });

    test('should return mock data when mockData is true', async () => {
        const mockId = '123';
        const mockDataResponse = { id: mockId };

        mock.getTransferDetails = jest.fn().mockReturnValueOnce(mockDataResponse);

        const result = await transfer.details(mockId);

        expect(mock.getTransferDetails).toHaveBeenCalledWith({ id: mockId });
        expect(result).toEqual(mockDataResponse);
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

    test('should get party from quote request correctly', () => {
        const quoteRequest = {
            body: {
                payer: {
                    partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1', partySubIdOrType: 'sub1', fspId: 'fsp1' },
                    name: 'payer1',
                    personalInfo: { complexName: { firstName: 'first', middleName: 'middle', lastName: 'last' }, dateOfBirth: '2000-01-01' },
                    merchantClassificationCode: 'code1',
                    extensionList: { extension: [] },
                },
            },
        };
        const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
        expect(result).toEqual({
            idType: 'type1',
            idValue: 'value1',
            idSubType: 'sub1',
            displayName: 'payer1',
            firstName: 'first',
            middleName: 'middle',
            lastName: 'last',
            dateOfBirth: '2000-01-01',
            merchantClassificationCode: 'code1',
            fspId: 'fsp1',
            extensionList: undefined,
        });
    });

    test('should convert complex name to display name correctly', () => {
        const complexName = { firstName: 'first', middleName: 'middle', lastName: 'last' };
        const result = transfer._complexNameToDisplayName(complexName);
        expect(result).toBe('first middle last');
    });

    test('should convert party to transfer party correctly', () => {
        const party = {
            idType: 'type1',
            idValue: 'value1',
            idSubType: 'sub1',
            displayName: 'display',
            firstName: 'first',
            middleName: 'middle',
            lastName: 'last',
            dateOfBirth: '2000-01-01',
            merchantClassificationCode: 'code1',
            fspId: 'fsp1',
            extensionList: [],
        };
        const result = transfer._convertToTransferParty(party);
        expect(result).toEqual({
            type: '',
            idType: 'type1',
            idValue: 'value1',
            idSubType: 'sub1',
            displayName: 'display',
            firstName: 'first',
            middleName: 'middle',
            lastName: 'last',
            dateOfBirth: '2000-01-01',
            merchantClassificationCode: 'code1',
            fspId: 'fsp1',
            extensionList: [],
        });
    });

    test('avgResponseTime should return mock data when mockData is true', async () => {
        const mockAvgResponseTime = [
            { timestamp: 1609459200000, averageResponseTime: 1200 },
            { timestamp: 1609459260000, averageResponseTime: 1300 },
        ];
    
        mock.getTransfersAvgResponseTime = jest
            .fn()
            .mockResolvedValue(mockAvgResponseTime);
    
        const opts = { minutePrevious: 10 };
        const result = await transfer.avgResponseTime(opts);
        expect(result).toEqual(mockAvgResponseTime);
    });
    
    
    test('should handle undefined fxQuoteResponse in getConversionTerms', () => {
        const result = transfer._getConversionTermsFromFxQuoteResponse(undefined);
        expect(result).toEqual({
            charges: {
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' },
            },
            expiryDate: '',
            transferAmount: {
                sourceAmount: { amount: '', currency: '' },
                targetAmount: { amount: '', currency: '' }
            },
            exchangeRate: ''
        });
    });

    test('should correctly filter non-matching currencies in charge calculations', () => {
        const charges = [
            { sourceAmount: { amount: '10', currency: 'GBP' }, targetAmount: { amount: '20', currency: 'JPY' } },
            { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: { amount: '10', currency: 'EUR' } }
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '5', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '10', currency: 'EUR' }
        });
    });

    test('should handle hourly flow calculations with mock data', async () => {
        const mockFlowData = [{
            timestamp: 1609459200000,
            currency: 'USD',
            inbound: 1000,
            outbound: 2000
        }];
        mock.getFlows = jest.fn().mockResolvedValue(mockFlowData);
            
        const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
        expect(result).toEqual(mockFlowData);
        expect(mock.getFlows).toHaveBeenCalledWith({ hoursPrevious: 24 });
    });

    test('should handle error status summary with mock data', async () => {
        const mockErrors = [{ id: 'error1', status: 'ERROR' }];
        mock.getErrors = jest.fn().mockResolvedValue(mockErrors);
            
        const result = await transfer.errors({ startTimestamp: '2023-01-01' });
        expect(result).toEqual(mockErrors);
    });

    test('should handle status summary with mock data', async () => {
        const mockSummary = [
            { status: 'PENDING', count: 5 },
            { status: 'SUCCESS', count: 10 },
            { status: 'ERROR', count: 2 }
        ];
        mock.getTransferStatusSummary = jest.fn().mockResolvedValue(mockSummary);
            
        const result = await transfer.statusSummary({ startTimestamp: '2023-01-01' });
        expect(result).toEqual(mockSummary);
    });

    test('should handle findAllWithFX with mock data', async () => {
        const mockTransfers = [{ id: 'fx1', fx_source_currency: 'USD', fx_target_currency: 'EUR' }];
        mock.getTransfers = jest.fn().mockResolvedValue(mockTransfers);
            
        const result = await transfer.findAllWithFX({ limit: 10 });
        expect(result).toEqual(mockTransfers);
    });

    test('should handle undefined party in getPartyFromQuoteRequest', () => {
        const quoteRequest = { body: {} };
        const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
        expect(result).toBeUndefined();
    });

    test('should handle missing conversionTerms in fxQuoteResponse', () => {
        const fxQuoteResponse = { body: {} };
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result).toBeUndefined();
    });

    test('should handle empty raw data in convertToApiDetailFormat', () => {
        const transferData = {
            id: '1',
            raw: JSON.stringify({}),
            supported_currencies: '[]'
        };
        const result = transfer._convertToApiDetailFormat(transferData);
        expect(result.transferId).toBe('1');
        expect(result.needFx).toBeUndefined();
        expect(result.recipientCurrencies).toEqual([]);
    });

    test('should parse raw transfer request bodies with invalid JSON', () => {
        const transferRaw = {
            getPartiesRequest: { body: 'invalid json' },
            quoteRequest: { body: 'invalid json' }
        };
        expect(() => transfer._parseRawTransferRequestBodies(transferRaw)).toThrow();
    });

 
    test('should handle division by zero in exchange rate calculation', () => {
        const result = transfer._calculateExchangeRate('0', '200', '0', '20');
        expect(result).toBe(null);
    });

    test('should handle undefined values in charges calculation', () => {
        const charges = [
            { sourceAmount: undefined, targetAmount: { amount: '20', currency: 'EUR' }},
            { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: undefined }
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '5', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '20', currency: 'EUR' }
        });
    });

    test('should validate required fields in conversion terms', () => {
        const fxQuoteResponse = {
            body: {
                conversionTerms: JSON.stringify({
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                    charges: [],
                    expiration: '2020-01-01T00:00:00Z'
                })
            }
        };
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result).toEqual({
            charges: {
                totalSourceCurrencyCharges: { amount: '0', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '0', currency: 'EUR' },
            },
            expiryDate: '2020-01-01T00:00:00Z',
            transferAmount: {
                sourceAmount: { amount: '100', currency: 'USD' },
                targetAmount: { amount: '200', currency: 'EUR' },
            },
            exchangeRate: '2.0000',
        });
    });

    test('should handle partial complex name', () => {
        const result = transfer._complexNameToDisplayName({
            firstName: 'John',
            lastName: 'Doe'
        });
        expect(result).toBe('John Doe');
    });

    test('should correctly format complex name to display name', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John',
            middleName: 'M',
            lastName: 'Doe'
        })).toBe('John M Doe');
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John',
            lastName: 'Doe'
        })).toBe('John Doe');
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John'
        })).toBe('John');
        
        expect(transfer._complexNameToDisplayName(null)).toBeUndefined();
    });
    
    test('should convert party info to transfer party format', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
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
    
    test('should calculate exchange rate correctly', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        expect(transfer._calculateExchangeRate('100', '200', 10, 20)).toBe('2.0000');
        expect(transfer._calculateExchangeRate('0', '200', 10, 20)).toBe('-18.0000');
        expect(transfer._calculateExchangeRate('100', '0', 10, 20)).toBe('-0.2222');
    });
    
    test('should parse raw transfer request bodies', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        const rawTransfer = {
            getPartiesRequest: {
                body: JSON.stringify({ party: 'test' })
            },
            quoteRequest: {
                body: JSON.stringify({ quote: 'test' })
            }
        };
    
        const result = transfer._parseRawTransferRequestBodies(rawTransfer);
        
        expect(result.getPartiesRequest.body).toEqual({ party: 'test' });
        expect(result.quoteRequest.body).toEqual({ quote: 'test' });
    });
});

describe('Transfer Model Additional Tests', () => {
    let transfer;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            table: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereRaw: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            andWhereRaw: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            groupByRaw: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([]),
            sum: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            raw: jest.fn().mockReturnThis()
        };

        // Initialize mockDb.raw to handle different cases
        mockDb.raw.mockImplementation((query) => {
            if (query.includes('MIN')) {
                return { timestamp: 1000 };
            }
            return query;
        });

        // Setup default mock responses
        mockDb.where.mockResolvedValue([]);
        mockDb.orderBy.mockResolvedValue([]);
        mockDb.groupByRaw.mockResolvedValue([]);

        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Hourly Flow Tests', () => {
        test('should return mock data when mockData is true', async () => {
            transfer = new Transfer({ mockData: true, logger: console });
            const mockFlowData = [{
                timestamp: 1000,
                currency: 'USD',
                inbound: 300,
                outbound: 500
            }];
            mock.getFlows = jest.fn().mockResolvedValue(mockFlowData);
            
            const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
            expect(result).toEqual(mockFlowData);
        });
    });

    describe('_getConversionTermsFromFxQuoteResponse', () => {
        test('should extract conversion terms from FX quote response', () => {
            const fxQuoteResponse = {
                body: {
                    conversionTerms: {
                        sourceAmount: { amount: '100', currency: 'EUR' },
                        targetAmount: { amount: '120', currency: 'USD' },
                        charges: [],
                        expiration: '2023-12-31'
                    }
                }
            };

            const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);

            expect(result).toMatchObject({
                transferAmount: {
                    sourceAmount: { amount: '100', currency: 'EUR' },
                    targetAmount: { amount: '120', currency: 'USD' }
                },
                expiryDate: '2023-12-31'
            });
        });

        test('should handle undefined FX quote response', () => {
            const result = transfer._getConversionTermsFromFxQuoteResponse(undefined);
            expect(result).toMatchObject({
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' }
                }
            });
        });
    });

    describe('_calculateTotalChargesFromCharges', () => {
        test('should calculate total charges correctly', () => {
            const charges = [
                {
                    sourceAmount: { amount: '10', currency: 'EUR' },
                    targetAmount: { amount: '12', currency: 'USD' }
                },
                {
                    sourceAmount: { amount: '5', currency: 'EUR' },
                    targetAmount: { amount: '6', currency: 'USD' }
                }
            ];

            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'EUR',
                'USD'
            );

            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '15', currency: 'EUR' },
                totalTargetCurrencyCharges: { amount: '18', currency: 'USD' }
            });
        });

        test('should handle empty charges', () => {
            const result = transfer._calculateTotalChargesFromCharges(
                null,
                'EUR',
                'USD'
            );

            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' }
            });
        });
    });
});

describe('Transfer Model Error Handling', () => {
    let transfer;
    const mockDb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        andWhereRaw: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        raw: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        sum: jest.fn().mockReturnThis(),
        groupByRaw: jest.fn().mockReturnThis()
    };

    beforeEach(() => {
        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb
        });
        jest.clearAllMocks();
    });

    describe('successRate Method Tests', () => {
        test('should return success rate data with correct structure', async () => {
            transfer = new Transfer({
                mockData: true,
                logger: { log: jest.fn() },
                db: mockDb
            });

            const mockResult = [
                { percentage: 22, timestamp: '2024-12-23T14:44:59.959Z' }
            ];
            mock.getTransferSuccessRate = jest.fn().mockResolvedValue(mockResult);
            
            const result = await transfer.successRate({ minutePrevious: 10 });
            
            expect(result[0]).toHaveProperty('percentage');
            expect(result[0]).toHaveProperty('timestamp');
            expect(typeof result[0].percentage).toBe('number');
            expect(typeof result[0].timestamp).toBe('string');
        });
    });

    describe('_getPartyFromQuoteRequest Additional Tests', () => {
        test('should handle missing personalInfo', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1' },
                        name: 'test'
                    }
                }
            };
            
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            
            expect(result.displayName).toBe('test');
            expect(result.firstName).toBeUndefined();
            expect(result.lastName).toBeUndefined();
        });

        test('should handle missing extensionList', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1' }
                    }
                }
            };
            
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            
            expect(result.extensionList).toBeUndefined();
        });
    });

    describe('findAllWithFX Additional Tests', () => {
        describe('_convertToApiDetailFormat Additional Tests', () => {
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
        });

        test('should handle null charges in _calculateTotalChargesFromCharges', () => {
            const result = transfer._calculateTotalChargesFromCharges(null, 'USD', 'EUR');
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' }
            });
        });
    });
});
