const { getTransfers } = require('../../../../src/lib/model/mock/Transfer');

describe('getTransfers', () => {
    test('should return an array of transfers with default options', () => {
        const transfers = getTransfers({});
        expect(Array.isArray(transfers)).toBe(true);
        expect(transfers.length).toBeGreaterThanOrEqual(10);
        expect(transfers.length).toBeLessThanOrEqual(10000);
        transfers.forEach(transfer => {
            expect(transfer).toHaveProperty('id');
            expect(transfer).toHaveProperty('batchId');
            expect(transfer).toHaveProperty('institution');
            expect(transfer).toHaveProperty('direction');
            expect(transfer).toHaveProperty('currency');
            expect(transfer).toHaveProperty('value');
            expect(transfer).toHaveProperty('type');
            expect(transfer).toHaveProperty('status');
            expect(transfer).toHaveProperty('initiatedTimestamp');
        });
    });

    test('should return transfers within the specified date range', () => {
        const startTimestamp = '2023-01-01T00:00:00Z';
        const endTimestamp = '2023-01-31T23:59:59Z';
        const transfers = getTransfers({ startTimestamp, endTimestamp });
        transfers.forEach(transfer => {
            const initiatedTimestamp = new Date(transfer.initiatedTimestamp);
            expect(initiatedTimestamp).toBeGreaterThanOrEqual(new Date(startTimestamp));
            expect(initiatedTimestamp).toBeLessThanOrEqual(new Date(endTimestamp));
        });
    });

    test('should return transfers with the specified institution', () => {
        const institution = 'TESTIN';
        const transfers = getTransfers({ institution });
        transfers.forEach(transfer => {
            expect(transfer.institution).toBe(institution);
        });
    });

    test('should return transfers with the specified status', () => {
        const status = 'SUCCESS';
        const transfers = getTransfers({ status });
        transfers.forEach(transfer => {
            expect(transfer.status).toBe(status);
        });
    });

    test('should return transfers with the specified batchId', () => {
        const batchId = 12345;
        const transfers = getTransfers({ batchId });
        transfers.forEach(transfer => {
            expect(transfer.batchId).toBe(batchId);
        });
    });

    test('should return transfers with multiple filters', () => {
        const filters = {
            startTimestamp: '2023-01-01T00:00:00Z',
            endTimestamp: '2023-01-31T23:59:59Z',
            institution: 'TESTIN',
            status: 'SUCCESS'
        };
        const transfers = getTransfers(filters);
        transfers.forEach(transfer => {
            const initiatedTimestamp = new Date(transfer.initiatedTimestamp);
            expect(initiatedTimestamp).toBeGreaterThanOrEqual(new Date(filters.startTimestamp));
            expect(initiatedTimestamp).toBeLessThanOrEqual(new Date(filters.endTimestamp));
            expect(transfer.institution).toBe(filters.institution);
            expect(transfer.status).toBe(filters.status);
        });
    });

    test('should handle invalid date range', () => {
        const startTimestamp = '2023-01-31T23:59:59Z';
        const endTimestamp = '2023-01-01T00:00:00Z';
        const transfers = getTransfers({ startTimestamp, endTimestamp });
        expect(transfers.length).toBe(0);
    });

    test('should handle no transfers found', () => {
        const institution = 'NONEXISTENT';
        const transfers = getTransfers({ institution });
        expect(transfers.length).toBe(0);
    });

    test('should return transfers with the specified institution', () => {
        const institution = 'TESTIN';
        const transfers = getTransfers({ institution });
        transfers.forEach(transfer => {
            expect(transfer.institution).toBe(institution);
        });
    });

    test('should return transfers with the specified status', () => {
        const status = 'SUCCESS';
        const transfers = getTransfers({ status });
        transfers.forEach(transfer => {
            expect(transfer.status).toBe(status);
        });
    });
});
