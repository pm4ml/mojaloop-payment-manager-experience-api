// monetaryZoneModel.test.js
const { Requests } = require('@internal/requests');
const MonetaryZoneModel = require('../../../src/lib/model/MonetaryZoneModel'); // Adjust the import based on your file structure

jest.mock('@internal/requests'); // Mocking the Requests class

describe('MonetaryZoneModel', () => {
    let monetaryZoneModel;
    let mockLogger;
    let mockManagementEndpoint;

    beforeEach(() => {
        mockLogger = { log: jest.fn() };
        mockManagementEndpoint = 'http://mock-endpoint.com';
        monetaryZoneModel = new MonetaryZoneModel({
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

    it('should call get on Requests with the correct endpoint', async () => {
        const mockResponse = { zones: ['USD', 'EUR', 'GBP'] };
        monetaryZoneModel._requests.get.mockResolvedValue(mockResponse); // Mocking the get method

        const result = await monetaryZoneModel.getMonetaryZones();

        expect(monetaryZoneModel._requests.get).toHaveBeenCalledWith('monetaryzones');
        expect(result).toEqual(mockResponse);
    });

    it('should handle errors thrown by the Requests.get method', async () => {
        const mockError = new Error('Network Error');
        monetaryZoneModel._requests.get.mockRejectedValue(mockError); // Mocking an error

        await expect(monetaryZoneModel.getMonetaryZones()).rejects.toThrow('Network Error');
    });
});

