// Import the required modules
const { getPositions } = require('../../../src/lib/model/mock/Position'); // Update with the actual module path
const { fakeAmount } = require('../../../src/lib/model/mock/common');

jest.mock('../../../src/lib/model/mock/common', () => ({
    fakeAmount: jest.fn(),
}));

describe('getPositions', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    it('should return an array of positions with the correct length', () => {
        fakeAmount.mockReturnValue(100); // Mock `fakeAmount` to return 100

        const positions = getPositions({ hoursPrevious: 3 });

        expect(positions).toHaveLength(3);
        positions.forEach((position) => {
            expect(position).toHaveProperty('position', 100);
            expect(position).toHaveProperty('reserved', 100);
            expect(position).toHaveProperty('committed', 100);
            expect(position).toHaveProperty('liquidity', 100);
            expect(position).toHaveProperty('timestamp');

            // Ensure timestamp is a valid ISO string
            expect(new Date(position.timestamp).toISOString()).toBe(position.timestamp);
        });
    });

    it('should default to 1 hour if hoursPrevious is not provided', () => {
        fakeAmount.mockReturnValue(50); // Mock `fakeAmount` to return 50

        const positions = getPositions({});

        expect(positions).toHaveLength(1);
        expect(positions[0]).toHaveProperty('position', 50);
        expect(positions[0]).toHaveProperty('reserved', 50);
        expect(positions[0]).toHaveProperty('committed', 50);
        expect(positions[0]).toHaveProperty('liquidity', 50);
        expect(positions[0]).toHaveProperty('timestamp');
    });

    it('should correctly calculate timestamps for each position', () => {
        fakeAmount.mockReturnValue(100);
        const now = new Date();

        jest.spyOn(global, 'Date').mockImplementation(() => now);

        const positions = getPositions({ hoursPrevious: 2 });

        expect(positions).toHaveLength(2);
        expect(new Date(positions[0].timestamp)).toEqual(now);
        expect(new Date(positions[1].timestamp)).toEqual(
            new Date(now.getTime() - 1 * 60 * 60 * 1000)
        );

        global.Date.mockRestore(); // Restore the original Date implementation
    });
});
