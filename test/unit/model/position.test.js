const Position = require('../../../src/lib/model/Position');
const { NotImplementedError } = require('@internal/utils');
const mock = require('../../../src/lib/model/mock');

jest.mock('../../../src/lib/model/mock', () => ({
    getPositions: jest.fn(),
}));
describe('Position', () => {
    let position;

    beforeEach(() => {
        position = new Position({ mockData: true });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return mocked positions when mockData is true', async () => {
        const mockPositions = [
            { id: 1, name: 'Position 1' },
            { id: 2, name: 'Position 2' },
        ];
        mock.getPositions.mockResolvedValue(mockPositions);

        const opts = { hoursPrevious: 24 };
        const result = await position.findAll(opts);

        expect(mock.getPositions).toHaveBeenCalledWith(opts);
        expect(result).toEqual(mockPositions);
    });

    it('should throw NotImplementedError when mockData is false', async () => {
        position.mockData = false;
        const opts = { hoursPrevious: 24 };

        try {
            await position.findAll(opts);
        } catch (error) {
            expect(error).toBeInstanceOf(NotImplementedError);
        }
    });
});
