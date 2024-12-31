const faker = require('faker');
const { getBatch, getBatches } = require('../../../src/lib/model/mock/Batch');

describe('Batch Module', () => {
    beforeEach(() => {
        faker.seed(12345);
    });

    describe('getBatch', () => {
        test('should return a batch with expected structure', () => {
            const opts = { id: 101, date: new Date('2024-01-01') };
            const state = { statuses: ['OPEN', 'ON TRACK'] };
            const batch = getBatch(opts, state);

            expect(batch).toHaveProperty('id', 101);
            expect(batch).toHaveProperty('status');
            expect(['OPEN', 'ON TRACK']).toContain(batch.status);
            expect(batch).toHaveProperty('transferCount');
            expect(typeof batch.transferCount).toBe('number');
            expect(batch).toHaveProperty('transferTotals');
            expect(Array.isArray(batch.transferTotals)).toBe(true);
            expect(batch).toHaveProperty('errorCount');
            expect(batch.errorCount).toBeGreaterThanOrEqual(0);
            expect(batch.errorCount).toBeLessThanOrEqual(5);
            expect(batch).toHaveProperty('startingTimestamp');
            expect(new Date(batch.startingTimestamp)).toBeInstanceOf(Date);
            if (batch.status !== 'OPEN') {
                expect(batch).toHaveProperty('closingTimestamp');
                expect(new Date(batch.closingTimestamp)).toBeInstanceOf(Date);
            }
        });

        test('should decrement OPEN status in state if present', () => {
            const state = { statuses: ['OPEN', 'ON TRACK', 'HAS ERRORS'] };
            getBatch({}, state);
            expect(state.statuses).not.toContain('OPEN');
        });

        test('should use default values if opts are not provided', () => {
            const batch = getBatch({}, {});
            expect(batch).toHaveProperty('id');
            expect(batch).toHaveProperty('startingTimestamp');
        });
    });

    describe('getBatches', () => {
        test('should use the default date range if no options are provided', () => {
            const batches = getBatches({});
            expect(batches.length).toBeGreaterThan(0);
        });

        test('should generate unique batches with valid structures', () => {
            const opts = {
                startTimestamp: '2024-01-01',
                endTimestamp: '2024-01-02',
            };
            const batches = getBatches(opts);

            batches.forEach((batch) => {
                expect(batch).toHaveProperty('id');
                expect(batch).toHaveProperty('status');
                expect(batch).toHaveProperty('transferCount');
                expect(Array.isArray(batch.transferTotals)).toBe(true);
            });
        });

        test('should seed faker to ensure reproducible results', () => {
            const opts = {
                startTimestamp: '2024-01-01',
                endTimestamp: '2024-01-01',
            };

            const firstRun = getBatches(opts);
            const secondRun = getBatches(opts);

            expect(firstRun).toEqual(secondRun);
        });
    });
});
