const { getFlows } = require("../../../src/lib/model/mock/Flow"); // Adjust the import path
const { fakeAmount } = require("../../../src/lib/model/mock/common");

jest.mock("../../../src/lib/model/mock/common", () => ({
  fakeAmount: jest.fn(),
}));

describe("getFlows", () => {
  beforeEach(() => {
    fakeAmount.mockReturnValue("1000.00");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return flows with correct structure when hoursPrevious is 1", () => {
    const opts = { hoursPrevious: 1 };

    const flows = getFlows(opts);

    expect(flows.length).toBe(1);

    const flow = flows[0];
    expect(flow).toHaveProperty("inbound", "1000.00");
    expect(flow).toHaveProperty("outbound", "1000.00");
    expect(flow).toHaveProperty("timestamp");

    const flowTimestamp = new Date(flow.timestamp).getTime();
    const expectedTimestamp = new Date().setHours(new Date().getHours() - 1);
    expect(flowTimestamp).toBeGreaterThanOrEqual(expectedTimestamp);
  });

  test("should return flows for multiple hours when hoursPrevious is greater than 1", () => {
    const opts = { hoursPrevious: 3 };

    const flows = getFlows(opts);

    expect(flows.length).toBe(3);

    flows.forEach((flow) => {
      expect(flow).toHaveProperty("inbound", "1000.00");
      expect(flow).toHaveProperty("outbound", "1000.00");
      expect(flow).toHaveProperty("timestamp");
    });

    const now = new Date();
    flows.forEach((flow, index) => {
      const flowTimestamp = new Date(flow.timestamp).getTime();
      const expectedTimestamp = new Date(now).setHours(
        now.getHours() - (index + 1)
      );
      expect(flowTimestamp).toBeGreaterThanOrEqual(expectedTimestamp);
    });
  });

  test("should default hoursPrevious to 1 if not provided", () => {
    const opts = {};

    const flows = getFlows(opts);

    expect(flows.length).toBe(1);
  });
});
