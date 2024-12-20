const {
  currencies,
  fakeAmount,
} = require("../../../src/lib/model/mock/common");

describe("Currency Module", () => {
  test("currencies array should contain expected currency codes", () => {
    const expectedCurrencies = ["USD", "EUR", "MAD", "XOF"];
    expect(currencies).toEqual(expectedCurrencies);
  });

  test("fakeAmount function should return a string representation of a number with two decimal places", () => {
    const amount = fakeAmount();
    expect(typeof amount).toBe("string");
    expect(amount).toMatch(/^\d+\.\d{2}$/);
  });

  test("fakeAmount function should generate an amount within the specified range", () => {
    const amount = parseFloat(fakeAmount());
    expect(amount).toBeGreaterThanOrEqual(0.1);
    expect(amount).toBeLessThanOrEqual(10000.0);
  });
});
