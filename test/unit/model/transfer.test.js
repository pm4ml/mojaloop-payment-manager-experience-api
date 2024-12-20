const Transfer = require('../../../src/lib/model/Transfer');
const mock = require('../../../src/lib/model/mock');

const mockDb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
};

describe('Transfer Model', () => {
    let transfer;

    beforeEach(() => {
        transfer = new Transfer({
            mockData: true,
            logger: console,
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

    test('should return correct statuses', () => {
        expect(Transfer.STATUSES).toEqual({
            null: 'PENDING',
            1: 'SUCCESS',
            0: 'ERROR',
        });
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
            raw: JSON.stringify({ homeTransactionId: 'home1', lastError: { httpStatusCode: 500 } }),
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

    // test('should convert transfer to API detail format correctly', () => {
    //     const transferData = {
    //         id: '1',
    //         batch_id: 'batch1',
    //         dfsp: 'dfsp1',
    //         direction: 1,
    //         currency: 'USD',
    //         amount: '100',
    //         success: 1,
    //         created_at: '2020-01-01T00:00:00Z',
    //         sender: 'sender1',
    //         sender_id_type: 'type1',
    //         sender_id_sub_value: 'sub1',
    //         sender_id_value: 'value1',
    //         recipient: 'recipient1',
    //         recipient_id_type: 'type2',
    //         recipient_id_sub_value: 'sub2',
    //         recipient_id_value: 'value2',
    //         raw: JSON.stringify({ homeTransactionId: 'home1', lastError: { httpStatusCode: 500 } }),
    //         details: 'details1',
    //     };

    //     const result = transfer._convertToApiDetailFormat(transferData);
    //     expect(result).toEqual(expect.objectContaining({
    //         transferId: '1',
    //         transferState: 'SUCCESS',
    //         direction: 'OUTBOUND',
    //         sendAmount: '100',
    //         sendCurrency: 'USD',
    //         dateSubmitted: new Date('2020-01-01T00:00:00Z'),
    //     }));
    // });

    // test('should get party from quote request correctly', () => {
    //     const quoteRequest = {
    //         body: {
    //             payer: {
    //                 partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1', partySubIdOrType: 'sub1', fspId: 'fsp1' },
    //                 name: 'payer1',
    //                 personalInfo: { complexName: { firstName: 'first', middleName: 'middle', lastName: 'last' }, dateOfBirth: '2000-01-01' },
    //                 merchantClassificationCode: 'code1',
    //                 extensionList: { extension: [] },
    //             },
    //         },
    //     };
    //     const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
    //     expect(result).toEqual({
    //         idType: 'type1',
    //         idValue: 'value1',
    //         idSubType: 'sub1',
    //         displayName: 'payer1',
    //         firstName: 'first',
    //         middleName: 'middle',
    //         lastName: 'last',
    //         dateOfBirth: '2000-01-01',
    //         merchantClassificationCode: 'code1',
    //         fspId: 'fsp1',
    //         extensionList: [],
    //     });
    // });

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

    // test('should find all transfers correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ id: '1', raw: '{}' }]);
    //     const result = await transfer.findAll({});
    //     expect(result).toEqual([{ id: '1', raw: {} }]);
    // });

    // test('should find all transfers with FX correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ id: '1', raw: '{}' }]);
    //     const result = await transfer.findAllWithFX({});
    //     expect(result).toEqual([{ id: '1', raw: {} }]);
    // });

    // test('should find one transfer correctly', async () => {
    //     mockDb.mockReturnValueOnce({ id: '1', raw: '{}' });
    //     const result = await transfer.findOne('1');
    //     expect(result).toEqual({ id: '1', raw: {} });
    // });

    // test('should find transfer details correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ id: '1', raw: '{}' }]);
    //     const result = await transfer.details('1');
    //     expect(result).toEqual(expect.objectContaining({ transferId: '1' }));
    // });

    // test('should calculate success rate correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ timestamp: 1, count: 10 }]);
    //     mockDb.mockReturnValueOnce([{ timestamp: 1, count: 5 }]);
    //     const result = await transfer.successRate({});
    //     expect(result).toEqual([{ timestamp: 1, percentage: 50 }]);
    // });

    // test('should calculate average response time correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ timestamp: 1, averageResponseTime: 1000 }]);
    //     const result = await transfer.avgResponseTime({});
    //     expect(result).toEqual([{ timestamp: 1, averageResponseTime: 1000 }]);
    // });

    // test('should retrieve status summary correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ success: 1, count: 10 }]);
    //     const result = await transfer.statusSummary({});
    //     expect(result).toEqual([{ status: 'SUCCESS', count: 10 }, { status: 'PENDING', count: 0 }, { status: 'ERROR', count: 0 }]);
    // });

    // test('should retrieve hourly flow correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ timestamp: 1, currency: 'USD', direction: 1, sum: 100 }]);
    //     const result = await transfer.hourlyFlow({});
    //     expect(result).toEqual([{ timestamp: 1, currency: 'USD', inbound: 0, outbound: 100 }]);
    // });

    // test('should retrieve transfer errors correctly', async () => {
    //     mockDb.mockReturnValueOnce([{ id: '1', raw: '{}' }]);
    //     const result = await transfer.errors({});
    //     expect(result).toEqual([{ id: '1', raw: {} }]);
    // });
});