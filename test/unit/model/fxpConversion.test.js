const FxpConversion = require('../../../src/lib/model/FxpConversion');
const mock = require('../../../src/lib/model/mock');

const mockDb = {
    where: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    fx_quote: jest.fn().mockReturnThis(),
};

describe('FxpConversion Class', () => {
    let fxpConversion;

    beforeEach(() => {
        fxpConversion = new FxpConversion({
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
        expect(fxpConversion.mockData).toBe(true);
        expect(fxpConversion._db).toBe(mockDb);
    });

    //   Test _joinFxQuotesAndFxTransfers method
    test('_joinFxQuotesAndFxTransfers should join fx_quote and fx_transfer tables and select correct fields', () => {
        const queryMock = {
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
        };
        const result = fxpConversion._joinFxQuotesAndFxTransfers(queryMock);

        // Assertions for leftJoin
        expect(queryMock.leftJoin).toHaveBeenCalledWith(
            'fx_transfer',
            'fx_quote.redis_key',
            'fx_transfer.redis_key'
        );

        // Assertions for select
        expect(queryMock.select).toHaveBeenCalledWith([
            'fx_quote.*',
            'fx_transfer.fulfilment as fulfilment',
            'fx_transfer.conversion_state as conversion_state',
            'fx_transfer.expiration as fx_transfer_expiration',
            'fx_transfer.commit_request_id as commit_request_id',
        ]);
        expect(result).toBe(queryMock);
    });

    // Test _fxpConversionLastErrorToErrorType method
    test('_fxpConversionLastErrorToErrorType should return error description if mojaloopError exists', () => {
        const err = {
            mojaloopError: { errorInformation: { errorDescription: 'Error' } },
        };
        expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe('Error');
    });

    test('_fxpConversionLastErrorToErrorType should return HTTP status code if mojaloopError is absent', () => {
        const err = { httpStatusCode: 500 };
        expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe(
            'HTTP 500'
        );
    });

    // Test _parseRawTransferRequestBodies method
    test('_parseRawTransferRequestBodies should parse stringified JSON in transferRaw', () => {
        const transferRaw = {
            fxQuoteResponse: { body: '{"key": "value"}' },
            fxQuoteRequest: { body: '{"key": "value"}' },
            fxPrepare: { body: '{"key": "value"}' },
            fulfil: { body: '{"key": "value"}' },
        };
        const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
        expect(result.fxQuoteResponse.body).toEqual({ key: 'value' });
        expect(result.fxQuoteRequest.body).toEqual({ key: 'value' });
    });

    test('should return unchanged object if no stringified JSON is present', () => {
        const transferRaw = { key: 'value' };
        const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
        expect(result).toEqual(transferRaw);
    });

    // Test _calculateTotalChargesFromCharges method
    test('_calculateTotalChargesFromCharges should calculate total charges correctly', () => {
        const charges = [
            {
                sourceAmount: { amount: '10', currency: 'USD' },
                targetAmount: { amount: '5', currency: 'EUR' },
            },
        ];
        const result = fxpConversion._calculateTotalChargesFromCharges(
            charges,
            'USD',
            'EUR'
        );
        expect(result.totalSourceCurrencyCharges.amount).toBe('10');
        expect(result.totalTargetCurrencyCharges.amount).toBe('5');
    });

    test('should return empty charges when charges array is null', () => {
        const result = fxpConversion._calculateTotalChargesFromCharges(
            null,
            'USD',
            'EUR'
        );
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '', currency: '' },
            totalTargetCurrencyCharges: { amount: '', currency: '' },
        });
    });

    // Test _getConversionTermsFromFxQuoteResponse method
    test('_getConversionTermsFromFxQuoteResponse should return conversion terms correctly', () => {
        const fxQuoteResponse = {
            body: {
                conversionTerms: {
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                    charges: [
                        {
                            sourceAmount: { amount: '2', currency: 'USD' },
                            targetAmount: { amount: '1', currency: 'EUR' },
                        },
                    ],
                },
            },
        };
        const result =
      fxpConversion._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result.transferAmount.sourceAmount.amount).toBe('100');
        expect(result.transferAmount.targetAmount.amount).toBe('200');
        expect(result.charges.totalSourceCurrencyCharges.amount).toBe('2');
    });

    // Test findAll method
    test('findAll should return mock data when mockData is true', async () => {
        const mockResponse = [{ conversionId: '123' }];
        mock.getFxpConversions = jest.fn().mockReturnValue(mockResponse);
        const result = await fxpConversion.findAll({ id: '123' });
        expect(result).toEqual(mockResponse);
    });

    it('should return mock data when mockData is true', async () => {
        const mockId = '123';
        const mockDataResponse = { id: mockId };

        // Mock the behavior of getFxpConversionDetails to return mock data
        mock.getFxpConversionDetails = jest
            .fn()
            .mockReturnValueOnce(mockDataResponse);

        const result = await fxpConversion.details(mockId);

        expect(mock.getFxpConversionDetails).toHaveBeenCalledWith({ id: mockId });
        expect(result).toEqual(mockDataResponse);
    });

    test('details should return null if no data found in database', async () => {
        fxpConversion._db = jest.fn().mockImplementation(() => mockDb);

        fxpConversion.mockData = false;
        const mockJoinFxQuotesAndFxTransfers = jest.fn();
        mockDb.where.mockReturnValueOnce(mockDb);

        mockJoinFxQuotesAndFxTransfers.mockResolvedValueOnce([]);

        const result = await fxpConversion.details('789');

        expect(result).toBeNull();
    });


    // Test successRate method with mockData set to true
    test('successRate should return mock data when mockData is true', async () => {
        const mockSuccessRate = [
            { timestamp: 1609459200000, percentage: 75 },
            { timestamp: 1609459260000, percentage: 80 },
        ];

        mock.getFxpConversionsSuccessRate = jest
            .fn()
            .mockResolvedValue(mockSuccessRate);

        const opts = { minutePrevious: 10 };
        const result = await fxpConversion.successRate(opts);

        expect(result).toEqual(mockSuccessRate);
    });

    // Test avgResponseTime with mockData set to true
    test('avgResponseTime should return mock data when mockData is true', async () => {
        const mockAvgResponseTime = [
            { timestamp: 1609459200000, averageResponseTime: 1200 },
            { timestamp: 1609459260000, averageResponseTime: 1300 },
        ];

        mock.getFxpConversionsAvgResponseTime = jest
            .fn()
            .mockResolvedValue(mockAvgResponseTime);

        const opts = { minutePrevious: 10 };
        const result = await fxpConversion.avgResponseTime(opts);
        expect(result).toEqual(mockAvgResponseTime);
    });
});
