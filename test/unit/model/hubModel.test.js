const { Requests } = require('@internal/requests');
const HubModel = require('../../../src/lib/model/HubModel');

jest.mock('@internal/requests');

describe('HubModel', () => {
    let hubModel;
    let mockLogger;
    let mockManagementEndpoint;

    beforeEach(() => {
        mockLogger = { log: jest.fn() };
        mockManagementEndpoint = 'http://mock-endpoint.com';
        hubModel = new HubModel({
            logger: mockLogger,
            managementEndpoint: mockManagementEndpoint,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should instantiate Requests with the correct parameters', () => {
        expect(Requests).toHaveBeenCalledWith({
            logger: mockLogger,
            endpoint: mockManagementEndpoint,
        });
    });

    it('should call get on Requests with the correct parameters', async () => {
        const opts = { direction: 'inbound', type: 'api', state: 'active' };
        const mockResponse = { data: 'some data' };

        hubModel._requests.get.mockResolvedValue(mockResponse);

        const result = await hubModel.getEndpoints(opts);

        expect(hubModel._requests.get).toHaveBeenCalledWith('hub/endpoints', opts);
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors thrown by the Requests.get method', async () => {
        const opts = { direction: 'outbound' };
        const mockError = new Error('Network Error');
        hubModel._requests.get.mockRejectedValue(mockError);

        await expect(hubModel.getEndpoints(opts)).rejects.toThrow('Network Error');
    });
});

