const {
  getFxpConversion,
  getFxpConversions,
  getFxpConversionDetails,
  getFxpConversionsSuccessRate,
  getFxpConversionsAvgResponseTime,
  getFxpConversionStatusSummary,
} = require("../../../src/lib/model/mock/FxpConversion");
const {
  fakeAmount,
  currencies,
} = require("../../../src/lib/model/mock/common");
const faker = require("faker");

jest.mock("faker");
jest.mock("../../../src/lib/model/mock/common", () => ({
  fakeAmount: jest.fn(() => 100),
  currencies: jest.fn(() => "USD"),
}));

describe("Fxp Conversion Functions", () => {
  beforeEach(() => {
    faker.random.uuid.mockReturnValue("uuid-1234");
    faker.random.number.mockReturnValue(100);
    faker.random.arrayElement.mockImplementation((arr) => {
      if (arr && arr.length > 0) {
        return arr[0];
      }
      return null;
    });
    faker.random.alphaNumeric.mockReturnValue("ABC123");
    faker.date.recent.mockReturnValue(new Date("2023-01-01"));
    faker.date.between.mockReturnValue(new Date("2023-01-02"));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getFxpConversionsSuccessRate should return an array of success rate objects with the correct structure", () => {
    const opts = { minutePrevious: 2 };
    const result = getFxpConversionsSuccessRate(opts);

    expect(result.length).toBe(2);

    result.forEach((item) => {
      expect(item).toHaveProperty("percentage");
      expect(item).toHaveProperty("timestamp");
    });
  });

  test("getFxpConversionsAvgResponseTime should return an array of avgResponseTime objects with the correct structure", () => {
    const opts = { minutePrevious: 3 };
    const result = getFxpConversionsAvgResponseTime(opts);

    expect(result.length).toBe(3);

    result.forEach((item) => {
      expect(item).toHaveProperty("averageResponseTime");
      expect(item).toHaveProperty("timestamp");
    });
  });

  test("getFxpConversionStatusSummary should return an array of status counts", () => {
    const opts = {};
    const result = getFxpConversionStatusSummary(opts);

    expect(result.length).toBe(3);

    result.forEach((statusSummary) => {
      expect(statusSummary).toHaveProperty("status");
      expect(statusSummary).toHaveProperty("count");
    });
  });

  it("should return a correctly structured object from getFxpConversion", () => {
    const conversion = getFxpConversion({});
    expect(conversion).toHaveProperty("conversionId");
    expect(conversion).toHaveProperty("batchId");
    expect(conversion).toHaveProperty("institution");
    expect(conversion).toHaveProperty("direction");
    expect(conversion).toHaveProperty("currency");
    expect(conversion).toHaveProperty("amount");
    expect(conversion).toHaveProperty("status");
    expect(conversion).toHaveProperty("initiatedTimestamp");
  });

  it("should return an array with the correct number of conversions from getFxpConversions", () => {
    const conversions = getFxpConversions({});
    expect(conversions.length).toBeGreaterThan(0);
  });

  it("should return an object with correct structure and values when options are passed", () => {
    const opts = {
      id: "custom-id-123",
      status: "completed",
      institution: "XYZ123",
    };
    const result = getFxpConversionDetails(opts);

    // Assert correct structure and values
    expect(result).toHaveProperty("determiningTransferId", "custom-id-123");
    expect(result).toHaveProperty("conversionId", "custom-id-123");
    expect(result).toHaveProperty("conversionRequestId", "custom-id-123");
    expect(result).toHaveProperty("status", "completed");
    expect(result).toHaveProperty("dfspInstitution", "XYZ123");

    expect(result.sourceAmount).toHaveProperty("amount", 100);
    expect(result.sourceAmount).toHaveProperty("currency", "USD");
    expect(result.targetAmount).toHaveProperty("amount", 100);
    expect(result.targetAmount).toHaveProperty("currency", "USD");
  });

  it("should generate random values if options are not passed", () => {
    const result = getFxpConversionDetails({});

    expect(result.determiningTransferId).toBe("uuid-1234");
    expect(result.conversionId).toBe("uuid-1234");
    expect(result.conversionRequestId).toBe("uuid-1234");
    expect(result.status).toBeDefined();
    expect(result.dfspInstitution).toBe("ABC123");

    expect(result.sourceAmount.amount).toBe(100);
    expect(result.sourceAmount.currency).toBe("USD");
    expect(result.targetAmount.amount).toBe(100);
    expect(result.targetAmount.currency).toBe("USD");
  });

  test("getFxpConversion should use startTimestamp if provided", () => {
    const startTimestamp = new Date("2023-01-01T00:00:00Z").toISOString();
    const opts = {
      startTimestamp,
      endTimestamp: undefined,
    };

    getFxpConversion(opts);

    expect(faker.date.recent).not.toHaveBeenCalled();
    expect(faker.date.between).toHaveBeenCalledWith(
      new Date(startTimestamp),
      expect.any(Date)
    );
  });

  test("getFxpConversion should use endTimestamp if provided", () => {
    const startTimestamp = undefined;
    const endTimestamp = new Date().toISOString();
    const opts = {
      startTimestamp,
      endTimestamp,
    };

    getFxpConversion(opts);

    expect(faker.date.recent).toHaveBeenCalledWith(20);

    expect(faker.date.between).toHaveBeenCalledWith(
      expect.objectContaining({
        getTime: expect.any(Function),
      }),
      expect.any(Date)
    );
  });

  test("getFxpConversionsAvgResponseTime should use default value for minutePrevious when not provided", () => {
    const opts = {};
    const result = getFxpConversionsAvgResponseTime(opts);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("averageResponseTime");
    expect(result[0]).toHaveProperty("timestamp");
  });

  test("getFxpConversionsAvgResponseTime should use the provided value for minutePrevious", () => {
    const opts = { minutePrevious: 3 };
    const result = getFxpConversionsAvgResponseTime(opts);
    expect(result.length).toBe(3);
    result.forEach((item) => {
      expect(item).toHaveProperty("averageResponseTime");
      expect(item).toHaveProperty("timestamp");
    });
  });

  test("getFxpConversionsSuccessRate should use default value for minutePrevious when not provided", () => {
    const opts = {};
    const result = getFxpConversionsSuccessRate(opts);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty("percentage");
    expect(result[0]).toHaveProperty("timestamp");
  });

  test("getFxpConversionsSuccessRate should use the provided value for minutePrevious", () => {
    const opts = { minutePrevious: 3 };
    const result = getFxpConversionsSuccessRate(opts);
    expect(result.length).toBe(3);
    result.forEach((item) => {
      expect(item).toHaveProperty("percentage");
      expect(item).toHaveProperty("timestamp");
    });
  });
});
