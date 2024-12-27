const faker = require('faker');
const { getErrors } = require('../../../src/lib/model/mock/Error');
const { fakeAmount } = require('../../../src/lib/model/mock/common');

jest.mock('../../../src/lib/model/mock/common', () => ({
    fakeAmount: jest.fn(),
    currencies: ['USD', 'EUR', 'GBP'],
}));

jest.mock('faker');

describe('Error.js', () => {
    beforeEach(() => {
    // Mock faker functions
        faker.random.number.mockImplementation(({ min, max }) =>
            Math.floor((min + max) / 2)
        );
        faker.random.arrayElement.mockImplementation((array) => array[0]);
        faker.date.recent.mockReturnValue(new Date('2023-01-01T00:00:00Z'));
        faker.date.between.mockReturnValue(new Date('2023-01-02T00:00:00Z'));
        fakeAmount.mockReturnValue('1234.56');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getErrors should return an array of error objects with expected structure', () => {
        const opts = {
            startTimestamp: undefined, 
            endTimestamp: new Date().toISOString(),
        };

        const errors = getErrors(opts);

        expect(errors.length).toBeGreaterThanOrEqual(5);
        expect(errors.length).toBeLessThanOrEqual(11);

        errors.forEach((error) => {
            // Assert that each error has the correct structure
            expect(error).toHaveProperty('id', 500050);
            expect(error).toHaveProperty('direction', 'INBOUND');
            expect(error).toHaveProperty('type', 'P2P');
            expect(error).toHaveProperty('currency', 'USD');
            expect(error).toHaveProperty('value', '1234.56');
            expect(error).toHaveProperty('errorType', 'INVALID SIGNATURE');
            expect(error).toHaveProperty('committedDate', '2023-01-02T00:00:00.000Z');

            const committedDate = new Date(error.committedDate).getTime();
            const startTimestamp = new Date('2023-01-01T00:00:00Z').getTime();
            const endTimestamp = new Date().getTime();

            expect(committedDate).toBeGreaterThanOrEqual(startTimestamp);
            expect(committedDate).toBeLessThanOrEqual(endTimestamp);
        });

        expect(faker.random.number).toHaveBeenCalledWith({ min: 5, max: 11 });
        expect(faker.random.number).toHaveBeenCalledWith({ min: 1e2, max: 1e6 });
        expect(faker.random.arrayElement).toHaveBeenCalledWith([
            'INBOUND',
            'OUTBOUND',
        ]);
        expect(faker.random.arrayElement).toHaveBeenCalledWith(['P2P']);
        expect(faker.random.arrayElement).toHaveBeenCalledWith([
            'USD',
            'EUR',
            'GBP',
        ]);
        expect(faker.random.arrayElement).toHaveBeenCalledWith([
            'INVALID SIGNATURE',
            'PAYER FSP INSUFFICIENT LIQUIDITY',
            'PAYER REJECTION',
            'PAYER REJECTED TXN REQUEST',
            'PAYER LIMIT ERROR',
            'PAYEE FSP INSUFFICIENT LIQUIDITY',
            'PAYEE REJECTED QUOTE',
            'PAYEE FSP REJECTED QUOTE',
            'PAYEE REJECTED TXN',
            'PAYEE FSP REJECTED TXN',
            'PAYEE UNSUPPORTED CURRENCY',
            'PAYEE LIMIT ERROR',
        ]);
        expect(faker.date.recent).toHaveBeenCalledWith(20);

        expect(faker.date.between).toHaveBeenCalledWith(
            expect.objectContaining({
                getTime: expect.any(Function),
            }),
            expect.objectContaining({
                getTime: expect.any(Function),
            })
        );
    });

    test('getErrors should use startTimestamp if provided', () => {
        const startTimestamp = new Date('2023-01-01T00:00:00Z').toISOString();
        const opts = {
            startTimestamp,
            endTimestamp: undefined,
        };

        getErrors(opts);

        expect(faker.date.recent).not.toHaveBeenCalled();
        expect(faker.date.between).toHaveBeenCalledWith(
            new Date(startTimestamp),
            expect.any(Date)
        );
    });

    test('getErrors should use endTimestamp if provided', () => {
        const startTimestamp = undefined;
        const endTimestamp = new Date().toISOString();
        const opts = {
            startTimestamp,
            endTimestamp,
        };

        getErrors(opts);

        expect(faker.date.recent).toHaveBeenCalledWith(20);
        expect(faker.date.between).toHaveBeenCalledWith(
            expect.objectContaining({
                getTime: expect.any(Function),
            }),
            expect.any(Date)
        );
    });
});
