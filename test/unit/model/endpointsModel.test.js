const { Requests } = require('@internal/requests');
const EndpointsModel = require('../../../src/lib/model/EndpointsModel');
// const { url } = require('koa-router');

jest.mock('@internal/requests');

describe('EndpointsModel', () => {
    let endpointsModel;
    let mockRequests;

    beforeEach(() => {
        mockRequests = new Requests();
        endpointsModel = new EndpointsModel({
            logger: console,
            managementEndpoint: 'http://example.com',
        });
        endpointsModel._requests = mockRequests;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getDFSPEgressEndpoints should call the correct endpoint', async () => {
        const opts = { type: 'IP' };
        mockRequests.get.mockResolvedValueOnce({});

        await endpointsModel.getDFSPEgressEndpoints(opts);

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/endpoints', {
            direction: 'EGRESS',
            type: opts.type,
        });
    });

    test('uploadDFSPEgressEndpoints should call the correct endpoint with IP type', async () => {
        const opts = { type: 'IP' };
        const body = { address: '192.168.0.1', ports: [80, 443] };
        mockRequests.post.mockResolvedValueOnce({});

        await endpointsModel.uploadDFSPEgressEndpoints(opts, body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/endpoints', {
            address: body.address,
            ports: body.ports,
            type: opts.type,
            direction: 'EGRESS',
        });
    });

    test('uploadDFSPEgressEndpoints should call the correct endpoint with URL type', async () => {
        const opts = { type: 'URL' };
        const body = { address: 'http://example.com' };
        mockRequests.post.mockResolvedValueOnce({});

        await endpointsModel.uploadDFSPEgressEndpoints(opts, body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/endpoints', {
            url: body.address,
            type: opts.type,
            direction: 'EGRESS',
        });
    });

    test('getDFSPIngressEndpoints should call the correct endpoint', async () => {
        const opts = { type: 'IP' };
        mockRequests.get.mockResolvedValueOnce({});

        await endpointsModel.getDFSPIngressEndpoints(opts);

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/endpoints', {
            direction: 'INGRESS',
            type: opts.type,
        });
    });

    test('deleteDFSPEndpoints should call the correct endpoint', async () => {
        const opts = { epId: '123' };
        mockRequests.delete.mockResolvedValueOnce({});

        await endpointsModel.deleteDFSPEndpoints(opts);

        expect(mockRequests.delete).toHaveBeenCalledWith(
            `dfsp/endpoints/${opts.epId}`
        );
    });

    test('deleteDFSPIngressEndpointsUrlById should call the correct endpoint', async () => {
        const opts = { epId: '123' };
        mockRequests.delete.mockResolvedValueOnce({});

        await endpointsModel.deleteDFSPIngressEndpointsUrlById(opts);

        expect(mockRequests.delete).toHaveBeenCalledWith(
            `dfsp/endpoints/${opts.epId}`
        );
    });

    test('getHubIngressEndpoints should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await endpointsModel.getHubIngressEndpoints();

        expect(mockRequests.get).toHaveBeenCalledWith('hub/endpoints', {
            direction: 'INGRESS',
            state: 'NEW',
        });
    });

    test('getHubEgressEndpoints should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await endpointsModel.getHubEgressEndpoints();

        expect(mockRequests.get).toHaveBeenCalledWith('hub/endpoints', {
            direction: 'EGRESS',
            state: 'NEW',
        });
    });

    test('updateDFSPEndpoints should call the correct endpoint with IP type', async () => {
        const opts = {
            type: 'IP',
            epId: '123',
            address: '192.168.0.1',
            ports: [80, 443],
            direction: 'EGRESS',
        };
        mockRequests.put.mockResolvedValueOnce({});

        await endpointsModel.updateDFSPEndpoints(opts);

        expect(mockRequests.put).toHaveBeenCalledWith(
            `dfsp/endpoints/${opts.epId}`,
            {
                address: opts.address,
                ports: opts.ports,
                type: opts.type,
                direction: opts.direction,
            }
        );
    });

    test('updateDFSPEndpoints should call the correct endpoint with URL type', async () => {
        const opts = {
            type: 'URL',
            epId: '123',
            address: 'https://example.com',
            direction: 'EGRESS',
        };
        mockRequests.put.mockResolvedValueOnce({});

        await endpointsModel.updateDFSPEndpoints(opts);

        expect(mockRequests.put).toHaveBeenCalledWith(
            `dfsp/endpoints/${opts.epId}`,
            {
                url: opts.address,
                type: opts.type,
                direction: opts.direction,
            }
        );
    });

    test('should update endpoint with IP address and ports', async () => {
        const opts = { type: 'IP', epId: '123' };
        const body = { ip: '192.168.1.100', ports: [80, 443] };

        await endpointsModel.updateDFSPIngressEndpointsUrlById(opts, body);

        expect(mockRequests.put).toHaveBeenCalledWith('dfsp/endpoints/123', {
            address: '192.168.1.100',
            ports: [80, 443],
        });
    });

    test('should update endpoint with URL', async () => {
        const opts = { type: 'URL', epId: '456' };
        const body = { address: 'https://example.com' };

        await endpointsModel.updateDFSPIngressEndpointsUrlById(opts, body);

        expect(mockRequests.put).toHaveBeenCalledWith('dfsp/endpoints/456', {
            url: 'https://example.com',
        });
    });

    test('should upload endpoint with IP address and ports', async () => {
        const opts = { type: 'IP' };
        const body = { address: '192.168.0.1', ports: [80, 443] };

        await endpointsModel.uploadDFSPIngressEndpoints(opts, body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/endpoints', {
            type: opts.type,
            direction: 'INGRESS',
            address: body.address,
            ports: body.ports,
        });
    });

    test('should upload endpoint with URL', async () => {
        const opts = { type: 'URL' };
        const body = { url: 'https://example.com' };

        await endpointsModel.uploadDFSPIngressEndpoints(opts, body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/endpoints', {
            type: opts.type,
            direction: 'INGRESS',
            url: body.address,
        });
    });
});
