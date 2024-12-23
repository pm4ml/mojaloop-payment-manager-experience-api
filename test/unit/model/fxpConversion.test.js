const FxpConversion = require("../../../src/lib/model/FxpConversion");
const mock = require("../../../src/lib/model/mock");

const mockDb = {
  count: jest.fn().mockReturnThis(),
  raw: jest.fn().mockReturnThis(),
  whereRaw: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
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

describe("FxpConversion Class", () => {
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

  test("should initialize with provided props", () => {
    expect(fxpConversion.mockData).toBe(true);
    expect(fxpConversion._db).toBe(mockDb);
  });

  //   Test _joinFxQuotesAndFxTransfers method
  test("should join fx_quote and fx_transfer tables and select correct fields", () => {
    const queryMock = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };
    const result = fxpConversion._joinFxQuotesAndFxTransfers(queryMock);

    expect(queryMock.leftJoin).toHaveBeenCalledWith(
      "fx_transfer",
      "fx_quote.redis_key",
      "fx_transfer.redis_key"
    );

    expect(queryMock.select).toHaveBeenCalledWith([
      "fx_quote.*",
      "fx_transfer.fulfilment as fulfilment",
      "fx_transfer.conversion_state as conversion_state",
      "fx_transfer.expiration as fx_transfer_expiration",
      "fx_transfer.commit_request_id as commit_request_id",
    ]);
    expect(result).toBe(queryMock);
  });

  // Test _fxpConversionLastErrorToErrorType method
  test("should return error description if mojaloopError exists", () => {
    const err = {
      mojaloopError: { errorInformation: { errorDescription: "Error" } },
    };
    expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe("Error");
  });

  test("should return HTTP status code if mojaloopError does not exists", () => {
    const err = { httpStatusCode: 500 };
    expect(FxpConversion._fxpConversionLastErrorToErrorType(err)).toBe(
      "HTTP 500"
    );
  });

  // Test _parseRawTransferRequestBodies method
  test("should parse raw transfer request bodies correctly", () => {
    const transferRaw = {
      fxQuoteResponse: { body: '{"key": "value"}' },
      fxQuoteRequest: { body: '{"key": "value"}' },
      fxPrepare: { body: '{"key": "value"}' },
      fulfil: { body: '{"key": "value"}' },
    };
    const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
    expect(result).toEqual({
      fxQuoteResponse: { body: { key: "value" } },
      fxQuoteRequest: { body: { key: "value" } },
      fxPrepare: { body: { key: "value" } },
      fulfil: { body: { key: "value" } },
    });
  });

  test("should return unchanged object if no stringified JSON is present", () => {
    const transferRaw = { key: "value" };
    const result = fxpConversion._parseRawTransferRequestBodies(transferRaw);
    expect(result).toEqual(transferRaw);
  });

  // Test _calculateTotalChargesFromCharges method
  test("should calculate total charges correctly", () => {
    const charges = [
      {
        sourceAmount: { amount: "10", currency: "USD" },
        targetAmount: { amount: "5", currency: "EUR" },
      },
    ];
    const result = fxpConversion._calculateTotalChargesFromCharges(
      charges,
      "USD",
      "EUR"
    );
    expect(result.totalSourceCurrencyCharges.amount).toBe("10");
    expect(result.totalTargetCurrencyCharges.amount).toBe("5");
  });

  test("should return empty charges when charges array is null", () => {
    const result = fxpConversion._calculateTotalChargesFromCharges(
      null,
      "USD",
      "EUR"
    );
    expect(result).toEqual({
      totalSourceCurrencyCharges: { amount: "", currency: "" },
      totalTargetCurrencyCharges: { amount: "", currency: "" },
    });
  });

  // Test _getConversionTermsFromFxQuoteResponse method
  test("should return conversion terms correctly", () => {
    const fxQuoteResponse = {
      body: {
        conversionTerms: {
          sourceAmount: { amount: "100", currency: "USD" },
          targetAmount: { amount: "200", currency: "EUR" },
          charges: [
            {
              sourceAmount: { amount: "2", currency: "USD" },
              targetAmount: { amount: "1", currency: "EUR" },
            },
          ],
        },
      },
    };
    const result =
      fxpConversion._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
    expect(result.transferAmount.sourceAmount.amount).toBe("100");
    expect(result.transferAmount.targetAmount.amount).toBe("200");
    expect(result.charges.totalSourceCurrencyCharges.amount).toBe("2");
  });

  // Test findAll method
  test("should return all fxpconversion mock data when mockData is true", async () => {
    const mockResponse = [{ conversionId: "123" }];
    mock.getFxpConversions = jest.fn().mockReturnValue(mockResponse);
    const result = await fxpConversion.findAll({ id: "123" });
    expect(result).toEqual(mockResponse);
  });

  // Test details method
  test("should return fxpconversion details mock data when mockData is true", async () => {
    const mockId = "123";
    const mockDataResponse = { id: mockId };

    // Mock the behavior of getFxpConversionDetails to return mock data
    mock.getFxpConversionDetails = jest
      .fn()
      .mockReturnValueOnce(mockDataResponse);

    const result = await fxpConversion.details(mockId);

    expect(mock.getFxpConversionDetails).toHaveBeenCalledWith({ id: mockId });
    expect(result).toEqual(mockDataResponse);
  });

  test("should return null fxpconversion details if no data found in database when mockdata is false", async () => {
    fxpConversion._db = jest.fn().mockImplementation(() => mockDb);

    fxpConversion.mockData = false;
    const mockJoinFxQuotesAndFxTransfers = jest.fn();
    mockDb.where.mockReturnValueOnce(mockDb);

    mockJoinFxQuotesAndFxTransfers.mockResolvedValueOnce([]);

    const result = await fxpConversion.details("789");

    expect(result).toBeNull();
  });
  
  // Test successRate method
  test("should return fxp conversion success rate mock data when mockData is true", async () => {
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

  // Test avgResponseTime
  test("should return fxp conversions average response time mock data when mockData is true", async () => {
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

  // Test _convertToApiFormat method
  test("should convert fxp conversion to API format correctly for outbound", () => {
    const fxpConversionData = {
      conversion_id: "conv123",
      batchId: "batch456",
      counter_party_fsp: "BankA",
      initiating_fsp: "BankB",
      direction: "OUTBOUND",
      source_amount: "5000",
      source_currency: "USD",
      success: 1,
      created_at: "2024-01-01T12:00:00Z",
      raw: JSON.stringify({
        lastError: { httpStatusCode: 404 },
      }),
    };

    const result = fxpConversion._convertToApiFormat(fxpConversionData);

    expect(result).toEqual({
      conversionId: "conv123",
      batchId: "batch456",
      institution: "BankA",
      direction: "OUTBOUND",
      amount: "5000",
      currency: "USD",
      initiatedTimestamp: "2024-01-01T12:00:00.000Z",
      status: "SUCCESS",
      errorType: null,
    });
  });

  test("should convert fxp conversion to API format correctly for inbound", () => {
    const fxpConversionData = {
      conversion_id: "conv123",
      batchId: "batch456",
      counter_party_fsp: "BankA",
      initiating_fsp: "BankB",
      direction: "INBOUND",
      source_amount: "5000",
      source_currency: "USD",
      success: 1,
      created_at: "2024-01-01T12:00:00Z",
      raw: JSON.stringify({
        lastError: { httpStatusCode: 404 },
      }),
    };

    const result = fxpConversion._convertToApiFormat(fxpConversionData);

    expect(result).toEqual({
      conversionId: "conv123",
      batchId: "batch456",
      institution: "BankB",
      direction: "INBOUND",
      amount: "5000",
      currency: "USD",
      initiatedTimestamp: "2024-01-01T12:00:00.000Z",
      status: "SUCCESS",
      errorType: null,
    });
  });

  test("should convert fxp conversion to API format correctly for outbound error", () => {
    const fxpConversionData = {
      conversion_id: "conv123",
      batchId: "batch456",
      counter_party_fsp: "BankA",
      initiating_fsp: "BankB",
      direction: "OUTBOUND",
      source_amount: "5000",
      source_currency: "USD",
      success: 0,
      created_at: "2024-01-01T12:00:00Z",
      raw: JSON.stringify({
        lastError: { httpStatusCode: 404 },
      }),
    };

    const result = fxpConversion._convertToApiFormat(fxpConversionData);

    expect(result).toEqual({
      conversionId: "conv123",
      batchId: "batch456",
      institution: "BankA",
      direction: "OUTBOUND",
      amount: "5000",
      currency: "USD",
      initiatedTimestamp: "2024-01-01T12:00:00.000Z",
      status: "ERROR",
      errorType: "HTTP 404",
    });
  });

  test("should convert fxp conversion to API format correctly for inbound error", () => {
    const fxpConversionData = {
      conversion_id: "conv123",
      batchId: "batch456",
      counter_party_fsp: "BankA",
      initiating_fsp: "BankB",
      direction: "INBOUND",
      source_amount: "5000",
      source_currency: "USD",
      success: 0,
      created_at: "2024-01-01T12:00:00Z",
      raw: JSON.stringify({
        lastError: { httpStatusCode: 404 },
      }),
    };

    const result = fxpConversion._convertToApiFormat(fxpConversionData);

    expect(result).toEqual({
      conversionId: "conv123",
      batchId: "batch456",
      institution: "BankB",
      direction: "INBOUND",
      amount: "5000",
      currency: "USD",
      initiatedTimestamp: "2024-01-01T12:00:00.000Z",
      status: "ERROR",
      errorType: "HTTP 404",
    });
  });

  // Test _convertToApiDetailFormat method
  test("should convert fxpConversion to API detail format correctly", () => {
    const fxpConversionData = {
      completed_at: "2020-01-01T00:00:00.000Z",
      conversionId: "conv1",
      conversion_id: "conv_1",
      conversion_request_id: "req1",
      batchId: "batch1",
      direction: "OUTBOUND",
      determining_transfer_id: "transfer1",
      source_amount: "100",
      source_currency: "USD",
      target_amount: "90",
      target_currency: "EUR",
      counter_party_fsp: "fsp2",
      initiating_fsp: "fsp1",
      commit_request_id: "commit1",
      amount_type: "SEND",
      raw: JSON.stringify({
        fxQuoteRequest: {
          body: {
            conversionTerms: {
              sourceAmount: {
                amount: "100",
                currency: "USD",
              },
              conversionState: "MockedState",
            },
          },
        },
        fxQuoteResponse: {
          body: {
            payeeReceiveAmount: {
              amount: "90",
              currency: "EUR",
            },
          },
        },
        fxTransferRequest: {
          body: "{}",
          headers: {},
        },
        fxPrepare: {
          body: {},
          headers: {},
        },
        fxTransferResponse: {
          body: "{}",
        },
        fulfil: {
          body: "{}",
        },
        lastError: {
          httpStatusCode: 500,
        },
      }),
    };

    jest
      .spyOn(fxpConversion, "_getConversionState")
      .mockImplementation(() => "MockedState");
    jest
      .spyOn(fxpConversion, "_parseRawTransferRequestBodies")
      .mockImplementation((raw) => raw);
    jest
      .spyOn(fxpConversion, "_getQuoteAmountFromFxQuoteRequest")
      .mockImplementation(() => ({ amount: "100", currency: "USD" }));
    jest
      .spyOn(fxpConversion, "_getConversionTermsFromFxQuoteResponse")
      .mockImplementation(() => "MockedTerms");

    const result = fxpConversion._convertToApiDetailFormat(fxpConversionData);

    expect(result).toEqual({
      conversionDetails: {
        determiningTransferId: "transfer1",
        conversionId: "conv1",
        conversionRequestId: "req1",
        conversionState: "MockedState",
        sourceAmount: {
          amount: "100",
          currency: "USD",
        },
        targetAmount: {
          amount: "90",
          currency: "EUR",
        },
        conversionAcceptedDate: new Date("2020-01-01T00:00:00.000Z"),
        conversionSettlementBatch: "batch1",
        conversionType: "Payer DFSP conversion",
        dfspInstitution: "fsp2",
      },
      conversionTerms: {
        determiningTransferId: "transfer1",
        conversionId: "conv_1",
        conversionState: "MockedState",
        quoteAmount: {
          amount: "100",
          currency: "USD",
        },
        quoteAmountType: "SEND",
        conversionTerms: "MockedTerms",
      },
      technicalDetails: {
        conversionRequestId: "req1",
        conversionId: "conv_1",
        determiningTransferId: "transfer1",
        commitRequestId: "commit1",
        conversionState: "MockedState",
        fxQuoteRequest: {
          body: {
            conversionTerms: {
              sourceAmount: {
                amount: "100",
                currency: "USD",
              },
              conversionState: "MockedState",
            },
          },
        },
        fxQuoteResponse: {
          body: {
            payeeReceiveAmount: {
              amount: "90",
              currency: "EUR",
            },
          },
        },
        fxTransferPrepare: {
          headers: {},
          body: {},
        },
        fxTransferFulfil: "{}",
        lastError: {
          httpStatusCode: 500,
        },
      },
    });

    const inboundFxpConversionData = {
      ...fxpConversionData,
      direction: "INBOUND",
      counter_party_fsp: "fsp1",
      initiating_fsp: "fsp2",
    };

    jest
      .spyOn(fxpConversion, "_getConversionState")
      .mockImplementation(() => "MockedState");
    jest
      .spyOn(fxpConversion, "_getQuoteAmountFromFxQuoteRequest")
      .mockImplementation(() => ({ amount: "90", currency: "EUR" }));

    const inboundResult = fxpConversion._convertToApiDetailFormat(
      inboundFxpConversionData
    );

    expect(inboundResult).toEqual({
      conversionDetails: {
        determiningTransferId: "transfer1",
        conversionId: "conv1",
        conversionRequestId: "req1",
        conversionState: "MockedState",
        sourceAmount: {
          amount: "100",
          currency: "USD",
        },
        targetAmount: {
          amount: "90",
          currency: "EUR",
        },
        conversionAcceptedDate: new Date("2020-01-01T00:00:00.000Z"),
        conversionSettlementBatch: "batch1",
        conversionType: "",
        dfspInstitution: "fsp2",
      },
      conversionTerms: {
        determiningTransferId: "transfer1",
        conversionId: "conv_1",
        conversionState: "MockedState",
        quoteAmount: {
          amount: "90",
          currency: "EUR",
        },
        quoteAmountType: "SEND",
        conversionTerms: "MockedTerms",
      },
      technicalDetails: {
        conversionRequestId: "req1",
        conversionId: "conv_1",
        determiningTransferId: "transfer1",
        commitRequestId: "commit1",
        conversionState: "MockedState",
        fxQuoteRequest: {
          body: {
            conversionTerms: {
              sourceAmount: {
                amount: "100",
                currency: "USD",
              },
              conversionState: "MockedState",
            },
          },
        },
        fxQuoteResponse: {
          body: {
            payeeReceiveAmount: {
              amount: "90",
              currency: "EUR",
            },
          },
        },
        fxTransferPrepare: {
          headers: {},
          body: {},
        },
        fxTransferFulfil: {
          body: "{}",
        },
        lastError: {
          httpStatusCode: 500,
        },
      },
    });

    // Add additional test cases to cover potential edge cases
    const incompleteData = {
      ...fxpConversionData,
      source_amount: null, // Edge case: null amount
    };

    const incompleteResult =
      fxpConversion._convertToApiDetailFormat(incompleteData);
    expect(incompleteResult.conversionDetails.sourceAmount.amount).toBeNull();
    expect(incompleteResult.conversionDetails.sourceAmount.currency).toBe(
      "USD"
    );
  });

  test("should return a list of conversion errors when query is successful", async () => {
    const opts = {
      startTimestamp: "2023-01-01T00:00:00.000Z",
      endTimestamp: "2023-12-31T23:59:59.999Z",
    };

    const mockResponse = [
      {
        conversionId: "conv_1",
        sourceAmount: "100",
        targetAmount: "90",
        success: false,
        errorMessage: "Sample error 1",
        fulfilment: "FULFILLED",
        conversion_state: "FAILED",
      },
      {
        conversionId: "conv_2",
        sourceAmount: "200",
        targetAmount: "180",
        success: false,
        errorMessage: "Sample error 2",
        fulfilment: "UNFULFILLED",
        conversion_state: "FAILED",
      },
    ];

    const mockQuery = {
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValueOnce(mockResponse),
    };

    fxpConversion._db = jest.fn().mockReturnValue(mockQuery);

    jest
      .spyOn(fxpConversion, "_convertToApiFormat")
      .mockImplementation((row) => ({
        conversionId: row.conversionId,
        errorMessage: row.errorMessage,
        fulfilment: row.fulfilment,
        conversionState: row.conversion_state,
      }));

    const result = await fxpConversion.fxpErrors(opts);

    expect(fxpConversion._db).toHaveBeenCalledWith("fx_quote");
    expect(mockQuery.where).toHaveBeenCalledWith("success", false);
    expect(mockQuery.leftJoin).toHaveBeenCalledWith(
      "fx_transfer",
      "fx_quote.redis_key",
      "fx_transfer.redis_key"
    );
    expect(mockQuery.select).toHaveBeenCalledWith([
      "fx_quote.*",
      "fx_transfer.fulfilment as fulfilment",
      "fx_transfer.conversion_state as conversion_state",
      "fx_transfer.expiration as fx_transfer_expiration",
      "fx_transfer.commit_request_id as commit_request_id",
    ]);
    expect(result).toEqual([
      {
        conversionId: "conv_1",
        errorMessage: "Sample error 1",
        fulfilment: "FULFILLED",
        conversionState: "FAILED",
      },
      {
        conversionId: "conv_2",
        errorMessage: "Sample error 2",
        fulfilment: "UNFULFILLED",
        conversionState: "FAILED",
      },
    ]);
  });

  test("should log and re-throw an error if any query fails in fxp errors", async () => {
    const mockError = new Error("Database connection error");
    fxpConversion._db = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockRejectedValueOnce(mockError),
    });

    fxpConversion.logger = { log: jest.fn() };

    await expect(fxpConversion.fxpErrors({})).rejects.toThrow(
      "Database connection error"
    );

    expect(fxpConversion.logger.log).toHaveBeenCalledWith(
      expect.stringContaining("Error getting transfer errors")
    );
  });
});
