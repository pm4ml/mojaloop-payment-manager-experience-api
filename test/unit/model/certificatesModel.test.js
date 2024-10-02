const { Requests } = require('@internal/requests');
const CertificatesModel = require('../../../src/lib/model/CertificatesModel');

jest.mock('@internal/requests');

describe('CertificatesModel', () => {
    let certificatesModel;
    let mockRequests;

    beforeEach(() => {
        mockRequests = new Requests();
        certificatesModel = new CertificatesModel({
            logger: console,
            managementEndpoint: 'http://example.com',
        });
        certificatesModel._requests = mockRequests;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getCertificates should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getCertificates();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/clientcerts');
    });

    test('uploadClientCSR should call the correct endpoint', async () => {
        const body = { csr: 'some-csr-data' };
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.uploadClientCSR(body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/clientcerts', body);
    });

    test('createClientCSR should call the correct endpoint', async () => {
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.createClientCSR();

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/clientcerts/csr');
    });

    test('getDFSPCA should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getDFSPCA();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/ca');
    });

    test('createDFSPCA should call the correct endpoint', async () => {
        const body = { caData: 'some-ca-data' };
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.createDFSPCA(body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/ca', body);
    });

    test('setDFSPCA should call the correct endpoint', async () => {
        const body = { caData: 'some-updated-ca-data' };
        mockRequests.put.mockResolvedValueOnce({});

        await certificatesModel.setDFSPCA(body);

        expect(mockRequests.put).toHaveBeenCalledWith('dfsp/ca', body);
    });

    test('getHubCA should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getHubCA();

        expect(mockRequests.get).toHaveBeenCalledWith('hub/cas');
    });

    test('getDFSPServerCertificates should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getDFSPServerCertificates();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/servercerts');
    });

    test('generateServerCertificates should call the correct endpoint', async () => {
        const body = { certData: 'some-cert-data' };
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.generateServerCertificates(body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/servercerts', body);
    });

    test('getHubServerCertificates should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getHubServerCertificates();

        expect(mockRequests.get).toHaveBeenCalledWith('hub/servercerts');
    });

    test('getAllJWSCertificates should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getAllJWSCertificates();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/alljwscerts');
    });

    test('getJWSCertificates should call the correct endpoint', async () => {
        mockRequests.get.mockResolvedValueOnce({});

        await certificatesModel.getJWSCertificates();

        expect(mockRequests.get).toHaveBeenCalledWith('dfsp/jwscerts');
    });

    test('uploadJWSCertificates should call the correct endpoint', async () => {
        const body = { jwsData: 'some-jws-data' };
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.uploadJWSCertificates(body);

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/jwscerts', body);
    });

    test('updateJWSCertificates should call the correct endpoint', async () => {
        const body = { jwsData: 'updated-jws-data' };
        mockRequests.put.mockResolvedValueOnce({});

        await certificatesModel.updateJWSCertificates(body);

        expect(mockRequests.put).toHaveBeenCalledWith('dfsp/jwscerts', body);
    });

    test('deleteJWSCertificates should call the correct endpoint', async () => {
        mockRequests.delete.mockResolvedValueOnce({});

        await certificatesModel.deleteJWSCertificates();

        expect(mockRequests.delete).toHaveBeenCalledWith('dfsp/jwscerts');
    });

    test('generateAllCerts should call the correct endpoint', async () => {
        mockRequests.post.mockResolvedValueOnce({});

        await certificatesModel.generateAllCerts();

        expect(mockRequests.post).toHaveBeenCalledWith('dfsp/allcerts');
    });
});

