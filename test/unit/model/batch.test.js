const Batch = require("../../../src/lib/model/Batch");
const mock = require("../../../src/lib/model/mock");

jest.mock("../../../src/lib/model/mock");

describe("Batch", () => {
  let batchInstance;
  let loggerMock;

  beforeEach(() => {
    loggerMock = { log: jest.fn() };
    batchInstance = new Batch({
      mockData: true,
      logger: loggerMock,
      managementEndpoint: "http://example.com",
    });
  });

  describe("findAll", () => {
    test("findAll should return mock data when mockData is true", () => {
      batchInstance.mockData = true;
      const mockBatches = [
        { id: "1", name: "Batch 1" },
        { id: "2", name: "Batch 2" },
      ];
      mock.getBatches = jest.fn().mockReturnValue(mockBatches);

      const opts = {
        startTimestamp: "2024-12-01T00:00:00Z",
        endTimestamp: "2024-12-02T00:00:00Z",
      };
      const result = batchInstance.findAll(opts);

      expect(mock.getBatches).toHaveBeenCalledWith(opts);
      expect(result).toEqual(mockBatches);
    });

    test("findAll should return mock data when mockData is false", () => {
      batchInstance.mockData = false;
      const mockBatches = [
        { id: "1", name: "Batch 1" },
        { id: "2", name: "Batch 2" },
      ];
      mock.getBatches = jest.fn().mockReturnValue(mockBatches);

      const opts = {
        startTimestamp: "2024-12-01T00:00:00Z",
        endTimestamp: "2024-12-02T00:00:00Z",
      };
      const result = batchInstance.findAll(opts);

      expect(mock.getBatches).toHaveBeenCalledWith(opts);
      expect(result).toEqual(mockBatches);
    });
  });

  describe("findOne", () => {
    test("findOne should return mock data when mockData is true", () => {
      batchInstance.mockData = true;
      const mockBatch = { id: "1" };
      mock.getBatch = jest.fn().mockReturnValue(mockBatch);

      const result = batchInstance.findOne("1");

      expect(mock.getBatch).toHaveBeenCalledWith({ id: "1" });
      expect(result).toEqual(mockBatch);
    });

    test("findOne should return mock data when mockData is false", () => {
      batchInstance.mockData = false;
      const mockBatch = { id: "1" };
      mock.getBatch = jest.fn().mockReturnValue(mockBatch);

      const result = batchInstance.findOne("1");

      expect(mock.getBatch).toHaveBeenCalledWith({ id: "1" });
      expect(result).toEqual(mockBatch);
    });
  });
});
