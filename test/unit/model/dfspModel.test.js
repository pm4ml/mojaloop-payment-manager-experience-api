const { Requests } = require('@internal/requests');
const DFSPModel = require('../../../src/lib/model/DFSPModel');

jest.mock('@internal/requests');

describe('DFSPModel', () => {
    let dfspModel;
    let mockRequests;

    beforeEach(() => {
        mockRequests = new Requests();
        dfspModel = new DFSPModel({
            dfspId: 'dfsp-123',
            logger: console,  // TODO: update the logger to use mojaloop logger
            managementEndpoint: 'http://example.com',
        });
        dfspModel._requests = mockRequests;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getDfspStatus should call the correct endpoint', async () => {
        const dfspId = 'dfsp-123';
        mockRequests.get.mockResolvedValueOnce({});

        await dfspModel.getDfspStatus(dfspId);

        expect(mockRequests.get).toHaveBeenCalledWith(`dfsps/${dfspId}/status`);
    });

    test('getDFSPDetails should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await dfspModel.getDFSPDetails();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp');
    });

    test('getAllDfsp should call the correct endpoint with options', async () => {
        const opts = { someOption: true };
        mockRequests.get.mockResolvedValueOnce({});

        await dfspModel.getAllDfsp(opts);

        expect(mockRequests.get).toHaveBeenCalledWith('dfsps', opts);
    });

    test('getDFSPsByMonetaryZone should call the correct endpoint', async () => {
        const opts = { monetaryZoneId: 'zone-456' };
        mockRequests.get.mockResolvedValueOnce({});

        await dfspModel.getDFSPsByMonetaryZone(opts);

        expect(mockRequests.get).toHaveBeenCalledWith(`monetaryzones/${opts.monetaryZoneId}/dfsps`, opts);
    });

    test('getEndpoints should call the correct endpoint with options', async () => {
        const opts = { direction: 'INGRESS', type: 'IP', state: 'ACTIVE' };
        mockRequests.get.mockResolvedValueOnce({});

        await dfspModel.getEndpoints(opts);

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/endpoints', opts);
    });

    test('createEndpoints should call the correct endpoint', async () => {
        const endpoint = {
            direction: 'INGRESS',
            type: 'IP',
            ports: [80, 443],
            address: '192.168.0.1'
        };
        mockRequests.post.mockResolvedValueOnce({});

        await dfspModel.createEndpoints(endpoint);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/endpoints', endpoint);
    });
});

