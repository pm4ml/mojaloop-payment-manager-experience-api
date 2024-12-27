const {
    getTransfer,
    getTransfers,
    getTransferDetails,
    getTransfersSuccessRate,
    getTransfersAvgResponseTime,
    getTransferStatusSummary,
} = require('../../../src/lib/model/mock/Transfer');
const faker = require('faker');

jest.mock('faker');
jest.mock('../../../src/lib/model/mock/common', () => ({
    fakeAmount: jest.fn(() => 100),
    currencies: jest.fn(() => 'USD'),
}));

describe('Transfer Functions', () => {
    beforeEach(() => {
        faker.random.uuid.mockReturnValue('d3b07384-d9a1-4e0f-a3f9-9b91c540f946');
        faker.random.number.mockReturnValue(100);
        faker.random.alphaNumeric.mockReturnValue('ABC123');
        faker.date.recent.mockReturnValue(new Date('2023-01-01'));
        faker.date.between.mockReturnValue(new Date('2023-01-02'));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getTransfer should return a transfer object with correct properties', () => {
        const opts = { id: 'custom-id-123', status: 'SUCCESS' };
        const result = getTransfer(opts);

        expect(result).toHaveProperty('id', 'custom-id-123');
        expect(result).toHaveProperty('batchId');
        expect(result).toHaveProperty('institution');
        expect(result).toHaveProperty('direction');
        expect(result).toHaveProperty('currency');
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('status', 'SUCCESS');
        expect(result).toHaveProperty('initiatedTimestamp');
    });

    test('getTransfers should return an array of transfer objects with correct length', () => {
        const opts = { status: 'PENDING' };
        const result = getTransfers(opts);

        expect(result.length).toBeGreaterThan(0);
        result.forEach((transfer) => {
            expect(transfer).toHaveProperty('id');
            expect(transfer).toHaveProperty('batchId');
        });
    });

    test('getTransferDetails should return a transfer details object with correct properties', () => {
        const opts = { id: 'custom-id-123' };
        const result = getTransferDetails(opts);

        expect(result).toHaveProperty('id', 'custom-id-123');
        expect(result).toHaveProperty('confirmationNumber');
        expect(result).toHaveProperty('amount');
        expect(result).toHaveProperty('sender');
        expect(result).toHaveProperty('recipient');
        expect(result).toHaveProperty('details');
        expect(result).toHaveProperty('status');
    });

    test('getTransfersSuccessRate should return an array of success rate objects with correct structure', () => {
        const opts = { minutePrevious: 3 };
        const result = getTransfersSuccessRate(opts);

        expect(result.length).toBe(3);
        result.forEach((item) => {
            expect(item).toHaveProperty('percentage');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransfersAvgResponseTime should return an array of avgResponseTime objects with correct structure', () => {
        const opts = { minutePrevious: 2 };
        const result = getTransfersAvgResponseTime(opts);

        expect(result.length).toBe(2);
        result.forEach((item) => {
            expect(item).toHaveProperty('averageResponseTime');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransferStatusSummary should return an array with status counts', () => {
        const opts = {};
        const result = getTransferStatusSummary(opts);

        expect(result.length).toBe(3);
        result.forEach((statusSummary) => {
            expect(statusSummary).toHaveProperty('status');
            expect(statusSummary).toHaveProperty('count');
        });
    });

    test('getTransfer should use startTimestamp if provided', () => {
        const startTimestamp = new Date('2023-01-01T00:00:00Z').toISOString();
        const opts = {
            startTimestamp,
            endTimestamp: undefined,
        };

        const result = getTransfer(opts);

        expect(faker.date.recent).not.toHaveBeenCalled();
        expect(faker.date.between).toHaveBeenCalledWith(
            new Date(startTimestamp),
            expect.any(Date)
        );
    });

    test('getTransfer should use endTimestamp if provided', () => {
        const startTimestamp = undefined;
        const endTimestamp = new Date().toISOString();
        const opts = {
            startTimestamp,
            endTimestamp,
        };

        const result = getTransfer(opts);

        expect(faker.date.recent).toHaveBeenCalledWith(20);
        expect(faker.date.between).toHaveBeenCalledWith(
            expect.objectContaining({
                getTime: expect.any(Function),
            }),
            expect.any(Date)
        );
    });

    test('getTransfersSuccessRate should use minutePrevious option if provided', () => {
        const opts = { minutePrevious: 5 };
        const result = getTransfersSuccessRate(opts);

        expect(result.length).toBe(5);
        result.forEach((item) => {
            expect(item).toHaveProperty('percentage');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransfersSuccessRate should use default minutePrevious of 1 if not provided', () => {
        const opts = {};
        const result = getTransfersSuccessRate(opts);

        expect(result.length).toBe(1);
        result.forEach((item) => {
            expect(item).toHaveProperty('percentage');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransfersAvgResponseTime should use minutePrevious option if provided', () => {
        const opts = { minutePrevious: 5 };
        const result = getTransfersAvgResponseTime(opts);

        expect(result.length).toBe(5);
        result.forEach((item) => {
            expect(item).toHaveProperty('averageResponseTime');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransfersAvgResponseTime should use default minutePrevious of 1 if not provided', () => {
        const opts = {};
        const result = getTransfersAvgResponseTime(opts);

        expect(result.length).toBe(1);
        result.forEach((item) => {
            expect(item).toHaveProperty('averageResponseTime');
            expect(item).toHaveProperty('timestamp');
        });
    });

    test('getTransferDetails should use provided id if opts.id is provided', () => {
        const providedId = '1234-5678-91011';
        const opts = { id: providedId };
        const result = getTransferDetails(opts);

        expect(result.id).toBe(providedId);
    });

    test('getTransferDetails should generate a new id if opts.id is not provided', () => {
        const opts = {}; // No id provided
        const result = getTransferDetails(opts);
        expect(result.id).toBeDefined();
        expect(result.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });
});
