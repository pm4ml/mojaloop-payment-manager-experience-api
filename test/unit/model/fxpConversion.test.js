const FxpConversion = require('../../../src/lib/model/FxpConversion');
const mock = require('../../../src/lib/model/mock');

const mockDb = {
    count: jest.fn().mockReturnThis(),
    raw: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    andWhereRaw: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    fx_quote: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
};

describe('FxpConversion Model', () => {
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

    test('should have correct static STATUSES', () => {
        expect(FxpConversion.STATUSES).toEqual({
            null: 'PENDING',
            1: 'SUCCESS',
            0: 'ERROR',
        });
    });
    //   Test _joinFxQuotesAndFxTransfers method
    test('should join fx_quote and fx_transfer tables and select correct fields', () => {
        const queryMock = {
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
        };
        const result = fxpConversion._joinFxQuotesAndFxTransfers(queryMock);

        expect(queryMock.leftJoin).toHaveBeenCalledWith(
            'fx_transfer',
            'fx_quote.redis_key',
            'fx_transfer.redis_key'
        );

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
    test('should return error description if mojaloopError exists', () => {
        const err = {
            mojaloopError: { errorInformation: { errorDescription: 'Error' } },
        };
        expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe('Error');
    });

    test('should return HTTP status code if mojaloopError does not exists', () => {
        const err = { httpStatusCode: 500 };
        expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe(
            'HTTP 500'
        );
    });

    // Test _parseRawTransferRequestBodies method
    test('should parse raw transfer request bodies correctly', () => {
        const transferRaw = {
            fxQuoteResponse: { body: '{"key": "value"}' },
            fxQuoteRequest: { body: '{"key": "value"}' },
            fxPrepare: { body: '{"key": "value"}' },
            fulfil: { body: '{"key": "value"}' },
        };
        const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
        expect(result).toEqual({
            fxQuoteResponse: { body: { key: 'value' } },
            fxQuoteRequest: { body: { key: 'value' } },
            fxPrepare: { body: { key: 'value' } },
            fulfil: { body: { key: 'value' } },
        });
    });

    test('should return unchanged object if no stringified JSON is present', () => {
        const transferRaw = { key: 'value' };
        const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
        expect(result).toEqual(transferRaw);
    });

    // Test _calculateTotalChargesFromCharges method
    test('should calculate total charges correctly', () => {
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
    test('should return conversion terms correctly', () => {
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

    test('should return default values when fxQuoteResponse is undefined', () => {
        const fxQuoteResponse = undefined;

        const result =
      fxpConversion._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result.charges.totalSourceCurrencyCharges.amount).toBe('');
        expect(result.charges.totalSourceCurrencyCharges.currency).toBe('');
        expect(result.charges.totalTargetCurrencyCharges.amount).toBe('');
        expect(result.charges.totalTargetCurrencyCharges.currency).toBe('');
        expect(result.expiryDate).toBe('');
        expect(result.transferAmount.sourceAmount.amount).toBe('');
        expect(result.transferAmount.sourceAmount.currency).toBe('');
        expect(result.transferAmount.targetAmount.amount).toBe('');
        expect(result.transferAmount.targetAmount.currency).toBe('');
        expect(result.exchangeRate).toBe('');
    });

    // Test _getQuoteAmountFromFxQuoteRequest
    test('should return empty response when fxQuoteRequest is undefined', () => {
        const fxQuoteRequest = undefined;

        const result =
      fxpConversion._getQuoteAmountFromFxQuoteRequest(fxQuoteRequest);

        expect(result.amount).toBe('');
        expect(result.currency).toBe('');
    });

    test('should return quoteAmount from sourceAmount when sourceAmount has amount', () => {
        const fxQuoteRequest = {
            body: {
                conversionTerms: {
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                },
            },
        };

        const result =
      fxpConversion._getQuoteAmountFromFxQuoteRequest(fxQuoteRequest);

        expect(result.amount).toBe('100');
        expect(result.currency).toBe('USD');
    });

    test('should return quoteAmount from targetAmount when sourceAmount has no amount', () => {
        const fxQuoteRequest = {
            body: {
                conversionTerms: {
                    sourceAmount: { amount: '', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                },
            },
        };

        const result =
      fxpConversion._getQuoteAmountFromFxQuoteRequest(fxQuoteRequest);

        expect(result.amount).toBe('200');
        expect(result.currency).toBe('EUR');
    });

    // Test _getConversionState
    test('should return raw.currentState when finalNotification is true', () => {
        const raw = { finalNotification: true, currentState: 'COMPLETED' };
        const fxpConversionData = { conversion_state: 'PROCESSING' };

        const result = fxpConversion._getConversionState(raw, fxpConversionData);
        expect(result).toBe('COMPLETED');
    });

    test('should return raw.currentState when conversion_state is null', () => {
        const raw = { finalNotification: false, currentState: 'COMPLETED' };
        const fxpConversionData = { conversion_state: null };

        const result = fxpConversion._getConversionState(raw, fxpConversionData);

        expect(result).toBe('COMPLETED');
    });

    test('should return fxpConversion.conversion_state when finalNotification is false and conversion_state is not null', () => {
        const raw = { finalNotification: false, currentState: 'COMPLETED' };
        const fxpConversionData = { conversion_state: 'IN_PROGRESS' };

        const result = fxpConversion._getConversionState(raw, fxpConversionData);

        expect(result).toBe('IN_PROGRESS');
    });

    // Test findAll method

    test('should return all fxpconversion mock data when mockData is true', async () => {
        const mockResponse = [{ conversionId: '123' }];
        mock.getFxpConversions = jest.fn().mockReturnValue(mockResponse);
        const result = await fxpConversion.findAll({ id: '123' });
        expect(mock.getFxpConversions).toHaveBeenCalledWith({ id: '123' });
        expect(result).toEqual(mockResponse);
    });

    // Test details method
    test('should return fxpconversion details mock data when mockData is true', async () => {
        const mockId = '123';
        const mockDataResponse = { id: mockId };

        mock.getFxpConversionDetails = jest
            .fn()
            .mockReturnValueOnce(mockDataResponse);

        const result = await fxpConversion.details(mockId);

        expect(mock.getFxpConversionDetails).toHaveBeenCalledWith({ id: mockId });
        expect(result).toEqual(mockDataResponse);
    });

    test('should return null fxpconversion details if no data found in database when mockdata is false', async () => {
        fxpConversion._db = jest.fn().mockImplementation(() => mockDb);

        fxpConversion.mockData = false;
        const mockJoinFxQuotesAndFxTransfers = jest.fn();
        mockDb.where.mockReturnValueOnce(mockDb);

        mockJoinFxQuotesAndFxTransfers.mockResolvedValueOnce([]);

        const result = await fxpConversion.details('789');

        expect(result).toBeNull();
    });

    test('should return converted API detail format for fxpconversion details if data is found in the database when mockdata is false', async () => {
        fxpConversion.mockData = false;
        const mockConversionId = '12345';
        const mockQueryResult = [
            {
                conversion_id: mockConversionId,
                source_amount: '100.00',
                source_currency: 'USD',
                target_amount: '80.00',
                target_currency: 'EUR',
            },
        ];

        mockDb.where.mockResolvedValue(mockQueryResult);
        fxpConversion._db = jest.fn().mockImplementation(() => mockDb);
        fxpConversion._joinFxQuotesAndFxTransfers = jest
            .fn()
            .mockReturnValue(mockDb);
        const mockApiDetails = {
            conversionDetails: {
                conversionId: mockConversionId,
                sourceAmount: {
                    amount: '100.00',
                    currency: 'USD',
                },
                targetAmount: {
                    amount: '80.00',
                    currency: 'EUR',
                },
                conversionState: 'SUCCESS',
            },
        };
        fxpConversion._convertToApiDetailFormat = jest
            .fn()
            .mockReturnValue(mockApiDetails);

        const result = await fxpConversion.details(mockConversionId);
        expect(result).toEqual(mockApiDetails);
        expect(fxpConversion._joinFxQuotesAndFxTransfers).toHaveBeenCalledTimes(1);
        expect(mockDb.where).toHaveBeenCalledWith(
            'fx_quote.conversion_id',
            mockConversionId
        );
        expect(fxpConversion._convertToApiDetailFormat).toHaveBeenCalledWith(
            mockQueryResult[0]
        );
    });

    // Test successRate method
    test('should return fxp conversion success rate mock data when mockData is true', async () => {
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

    // test("should execute database query and calculate success rate when mockData is false", async () => {
    //   const opts = { minutePrevious: 10 };

    //   // Mocking the database query results
    //   const successStat = [
    //     { timestamp: 1617075600000, count: 8 }, // 8 successful conversions
    //     { timestamp: 1617075660000, count: 3 }, // 3 successful conversions
    //   ];

    //   const allStat = [
    //     { timestamp: 1617075600000, count: 10 }, // 10 total conversions
    //     { timestamp: 1617075660000, count: 5 },  // 5 total conversions
    //   ];

    //   fxpConversion.mockData = false;
    //   mockDb.select.mockResolvedValue(successStat);
    //   mockDb.count.mockResolvedValue(allStat);
    //   mockDb.raw.mockReturnValue({
    //     minTimestamp: 'some value',
    //   });

    //   fxpConversion._db = jest.fn().mockReturnValue(mockDb);
    //   const result = await fxpConversion.successRate(opts);
    //   expect(mockDb.select).toHaveBeenCalled();
    //   expect(mockDb.count).toHaveBeenCalled();
    //   expect(mockDb.raw).toHaveBeenCalled();

    //   const expected = [
    //     { timestamp: 1617075600000, percentage: Math.trunc((8 / 10) * 100) }, // 80%
    //     { timestamp: 1617075660000, percentage: Math.trunc((3 / 5) * 100) },  // 60%
    //   ];

    //   expect(result).toEqual(expected);
    // });

    // Test avgResponseTime
    test('should return fxp conversions average response time mock data when mockData is true', async () => {
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

    test('should handle default minutePrevious value of 10', async () => {
        const mockRows = [
            { averageResponseTime: 1200, timestamp: 1609459200000 },
            { averageResponseTime: 1300, timestamp: 1609459260000 },
        ];

        mockDb._db = jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            raw: jest.fn().mockReturnThis(),
            whereRaw: jest.fn().mockReturnThis(),
            andWhereRaw: jest.fn().mockReturnThis(),
            groupByRaw: jest.fn().mockReturnThis(),
            then: jest.fn().mockResolvedValue(mockRows),
        });

        const opts = {};
        const result = await fxpConversion.avgResponseTime(opts);

        expect(result).toEqual(mockRows);
    });
    // Test fxpErrors

    test('should return a list of conversion errors when query is successful', async () => {
        const opts = {
            startTimestamp: '2023-01-01T00:00:00.000Z',
            endTimestamp: '2023-12-31T23:59:59.999Z',
        };

        const mockResponse = [
            {
                conversionId: 'conv_1',
                sourceAmount: '100',
                targetAmount: '90',
                success: false,
                errorMessage: 'Sample error 1',
                fulfilment: 'FULFILLED',
                conversion_state: 'FAILED',
            },
            {
                conversionId: 'conv_2',
                sourceAmount: '200',
                targetAmount: '180',
                success: false,
                errorMessage: 'Sample error 2',
                fulfilment: 'UNFULFILLED',
                conversion_state: 'FAILED',
            },
        ];

        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValueOnce(mockResponse),
        };

        fxpConversion._db = jest.fn().mockReturnValue(mockQuery);

        jest
            .spyOn(fxpConversion, '_convertToApiFormat')
            .mockImplementation((row) => ({
                conversionId: row.conversionId,
                errorMessage: row.errorMessage,
                fulfilment: row.fulfilment,
                conversionState: row.conversion_state,
            }));

        const result = await fxpConversion.fxpErrors(opts);

        expect(fxpConversion._db).toHaveBeenCalledWith('fx_quote');
        expect(mockQuery.where).toHaveBeenCalledWith('success', false);
        expect(mockQuery.leftJoin).toHaveBeenCalledWith(
            'fx_transfer',
            'fx_quote.redis_key',
            'fx_transfer.redis_key'
        );
        expect(mockQuery.select).toHaveBeenCalledWith([
            'fx_quote.*',
            'fx_transfer.fulfilment as fulfilment',
            'fx_transfer.conversion_state as conversion_state',
            'fx_transfer.expiration as fx_transfer_expiration',
            'fx_transfer.commit_request_id as commit_request_id',
        ]);
        expect(result).toEqual([
            {
                conversionId: 'conv_1',
                errorMessage: 'Sample error 1',
                fulfilment: 'FULFILLED',
                conversionState: 'FAILED',
            },
            {
                conversionId: 'conv_2',
                errorMessage: 'Sample error 2',
                fulfilment: 'UNFULFILLED',
                conversionState: 'FAILED',
            },
        ]);
    });

    test('should log and re-throw an error if any query fails in fxp errors', async () => {
        const mockError = new Error('Database connection error');
        fxpConversion._db = jest.fn().mockReturnValue({
            where: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockRejectedValueOnce(mockError),
        });

        fxpConversion.logger = { log: jest.fn() };

        await expect(fxpConversion.fxpErrors({})).rejects.toThrow(
            'Database connection error'
        );

        expect(fxpConversion.logger.log).toHaveBeenCalledWith(
            expect.stringContaining('Error getting transfer errors')
        );
    });
});

// Test _convertToApiFormat method

describe('FxpConversion _convertToApiFormat test case', () => {
    let fxpConversion;

    const baseFxpConversionData = {
        conversion_id: 'conv123',
        batchId: 'batch456',
        counter_party_fsp: 'BankA',
        initiating_fsp: 'BankB',
        source_amount: '5000',
        source_currency: 'USD',
        created_at: '2024-01-01T12:00:00Z',
        raw: JSON.stringify({
            lastError: { httpStatusCode: 404 },
        }),
    };

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

    test('should convert fxp conversion to API format correctly for outbound', () => {
        const outboundFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'OUTBOUND',
            success: 1,
        };

        const result = fxpConversion._convertToApiFormat(outboundFxpConversionData);

        expect(result).toEqual({
            conversionId: 'conv123',
            batchId: 'batch456',
            institution: 'BankA',
            direction: 'OUTBOUND',
            amount: '5000',
            currency: 'USD',
            initiatedTimestamp: '2024-01-01T12:00:00.000Z',
            status: 'SUCCESS',
            errorType: null,
        });
    });

    test('should convert fxp conversion to API format correctly for inbound', () => {
        const inboundFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'INBOUND',
            success: 1,
        };

        const result = fxpConversion._convertToApiFormat(inboundFxpConversionData);

        expect(result).toEqual({
            conversionId: 'conv123',
            batchId: 'batch456',
            institution: 'BankB',
            direction: 'INBOUND',
            amount: '5000',
            currency: 'USD',
            initiatedTimestamp: '2024-01-01T12:00:00.000Z',
            status: 'SUCCESS',
            errorType: null,
        });
    });

    test('should convert fxp conversion to API format correctly for outbound error', () => {
        const outboundErrorFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'OUTBOUND',
            success: 0,
        };

        const result = fxpConversion._convertToApiFormat(
            outboundErrorFxpConversionData
        );

        expect(result).toEqual({
            conversionId: 'conv123',
            batchId: 'batch456',
            institution: 'BankA',
            direction: 'OUTBOUND',
            amount: '5000',
            currency: 'USD',
            initiatedTimestamp: '2024-01-01T12:00:00.000Z',
            status: 'ERROR',
            errorType: 'HTTP 404',
        });
    });

    test('should convert fxp conversion to API format correctly for inbound error', () => {
        const inboundErrorFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'INBOUND',
            success: 0,
        };

        const result = fxpConversion._convertToApiFormat(
            inboundErrorFxpConversionData
        );

        expect(result).toEqual({
            conversionId: 'conv123',
            batchId: 'batch456',
            institution: 'BankB',
            direction: 'INBOUND',
            amount: '5000',
            currency: 'USD',
            initiatedTimestamp: '2024-01-01T12:00:00.000Z',
            status: 'ERROR',
            errorType: 'HTTP 404',
        });
    });
});

// Test _convertToApiDetailFormat method

describe('FxpConversion _convertToApiDetailFormat test case', () => {
    let fxpConversion;

    const baseFxpConversionData = {
        completed_at: '2020-01-01T00:00:00.000Z',
        conversionId: 'conv1',
        conversion_id: 'conv_1',
        conversion_request_id: 'req1',
        batchId: 'batch1',
        determining_transfer_id: 'transfer1',
        source_amount: '100',
        source_currency: 'USD',
        target_amount: '90',
        target_currency: 'EUR',
        commit_request_id: 'commit1',
        amount_type: 'SEND',
        raw: JSON.stringify({
            fxQuoteRequest: {
                body: {
                    conversionTerms: {
                        sourceAmount: {
                            amount: '100',
                            currency: 'USD',
                        },
                        conversionState: 'MockedState',
                    },
                },
            },
            fxQuoteResponse: {
                body: {
                    payeeReceiveAmount: {
                        amount: '90',
                        currency: 'EUR',
                    },
                },
            },
            fxTransferRequest: {
                body: '{}',
                headers: {},
            },
            fxPrepare: {
                body: {},
                headers: {},
            },
            fxTransferResponse: {
                body: '{}',
            },
            fulfil: {
                body: '{}',
            },
            lastError: {
                httpStatusCode: 500,
            },
        }),
    };

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

    test('should convert OUTBOUND fxpConversion to API detail format correctly', () => {
        const outboundFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'OUTBOUND',
            counter_party_fsp: 'fsp2',
            initiating_fsp: 'fsp1',
        };
        jest
            .spyOn(fxpConversion, '_getConversionState')
            .mockImplementation(() => 'MockedState');
        jest
            .spyOn(fxpConversion, '_parseRawTransferRequestBodies')
            .mockImplementation((raw) => raw);
        jest
            .spyOn(fxpConversion, '_getQuoteAmountFromFxQuoteRequest')
            .mockImplementation(() => ({ amount: '100', currency: 'USD' }));
        jest
            .spyOn(fxpConversion, '_getConversionTermsFromFxQuoteResponse')
            .mockImplementation(() => 'MockedTerms');

        const result = fxpConversion._convertToApiDetailFormat(
            outboundFxpConversionData
        );

        expect(result).toEqual({
            conversionDetails: {
                determiningTransferId: 'transfer1',
                conversionId: 'conv1',
                conversionRequestId: 'req1',
                conversionState: 'MockedState',
                sourceAmount: {
                    amount: '100',
                    currency: 'USD',
                },
                targetAmount: {
                    amount: '90',
                    currency: 'EUR',
                },
                conversionAcceptedDate: new Date('2020-01-01T00:00:00.000Z'),
                conversionSettlementBatch: 'batch1',
                conversionType: 'Payer DFSP conversion',
                dfspInstitution: 'fsp2',
            },
            conversionTerms: {
                determiningTransferId: 'transfer1',
                conversionId: 'conv_1',
                conversionState: 'MockedState',
                quoteAmount: {
                    amount: '100',
                    currency: 'USD',
                },
                quoteAmountType: 'SEND',
                conversionTerms: 'MockedTerms',
            },
            technicalDetails: {
                conversionRequestId: 'req1',
                conversionId: 'conv_1',
                determiningTransferId: 'transfer1',
                commitRequestId: 'commit1',
                conversionState: 'MockedState',
                fxQuoteRequest: {
                    body: {
                        conversionTerms: {
                            sourceAmount: {
                                amount: '100',
                                currency: 'USD',
                            },
                            conversionState: 'MockedState',
                        },
                    },
                },
                fxQuoteResponse: {
                    body: {
                        payeeReceiveAmount: {
                            amount: '90',
                            currency: 'EUR',
                        },
                    },
                },
                fxTransferPrepare: {
                    headers: {},
                    body: {},
                },
                fxTransferFulfil: '{}',
                lastError: {
                    httpStatusCode: 500,
                },
            },
        });
    });

    test('should convert INBOUND fxpConversion to API detail format correctly', () => {
        const inboundFxpConversionData = {
            ...baseFxpConversionData,
            direction: 'INBOUND',
            counter_party_fsp: 'fsp1',
            initiating_fsp: 'fsp2',
        };
        jest
            .spyOn(fxpConversion, '_parseRawTransferRequestBodies')
            .mockImplementation((raw) => raw);
        jest
            .spyOn(fxpConversion, '_getConversionTermsFromFxQuoteResponse')
            .mockImplementation(() => 'MockedTerms');
        jest
            .spyOn(fxpConversion, '_getConversionState')
            .mockImplementation(() => 'MockedState');
        jest
            .spyOn(fxpConversion, '_getQuoteAmountFromFxQuoteRequest')
            .mockImplementation(() => ({ amount: '90', currency: 'EUR' }));

        const result = fxpConversion._convertToApiDetailFormat(
            inboundFxpConversionData
        );

        expect(result).toEqual({
            conversionDetails: {
                determiningTransferId: 'transfer1',
                conversionId: 'conv1',
                conversionRequestId: 'req1',
                conversionState: 'MockedState',
                sourceAmount: {
                    amount: '100',
                    currency: 'USD',
                },
                targetAmount: {
                    amount: '90',
                    currency: 'EUR',
                },
                conversionAcceptedDate: new Date('2020-01-01T00:00:00.000Z'),
                conversionSettlementBatch: 'batch1',
                conversionType: '',
                dfspInstitution: 'fsp2',
            },
            conversionTerms: {
                determiningTransferId: 'transfer1',
                conversionId: 'conv_1',
                conversionState: 'MockedState',
                quoteAmount: {
                    amount: '90',
                    currency: 'EUR',
                },
                quoteAmountType: 'SEND',
                conversionTerms: 'MockedTerms',
            },
            technicalDetails: {
                conversionRequestId: 'req1',
                conversionId: 'conv_1',
                determiningTransferId: 'transfer1',
                commitRequestId: 'commit1',
                conversionState: 'MockedState',
                fxQuoteRequest: {
                    body: {
                        conversionTerms: {
                            sourceAmount: {
                                amount: '100',
                                currency: 'USD',
                            },
                            conversionState: 'MockedState',
                        },
                    },
                },
                fxQuoteResponse: {
                    body: {
                        payeeReceiveAmount: {
                            amount: '90',
                            currency: 'EUR',
                        },
                    },
                },
                fxTransferPrepare: {
                    headers: {},
                    body: {},
                },
                fxTransferFulfil: {
                    body: '{}',
                },
                lastError: {
                    httpStatusCode: 500,
                },
            },
        });
    });

    test('should throw error when incomplete data', async () => {
        const incompleteFxpConversionData = {
            ...baseFxpConversionData,
            source_amount: null,
        };

        const incompleteResult = fxpConversion._convertToApiDetailFormat(
            incompleteFxpConversionData
        );
        expect(incompleteResult.conversionDetails.sourceAmount.amount).toBeNull();
        expect(incompleteResult.conversionDetails.sourceAmount.currency).toBe(
            'USD'
        );
        expect(incompleteResult.technicalDetails.lastError.httpStatusCode).toBe(
            500
        );
    });
});
