'use strict';
const {
    EndpointsModel,
    MetricsModel,
    MonetaryZoneModel,
    DFSPModel,
    Transfer,
    Batch,
    FxpConversion,
    CertificatesModel,
    Position,
} = require('@internal/model');

const endpointsResource = require('./resources/endpointsResource');
const handlers = require('../../src/handlers');

describe('Inbound API handlers:', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Endpoints tests', () => {
        test('should set ctx.body to {"status":"ok"}', async () => {
            const ctx = {
                body: null,
            };
            await handlers['/health'].get(ctx);
            expect(ctx.body).toBe(JSON.stringify({ status: 'ok' }));
        });
        test('Create Egress endpoint calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.uploadEgressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'uploadDFSPEgressEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/egress/ips'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({ type: 'IP' });
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body.value);
        });

        test('Create Ingress endpoint calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.uploadIngressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'uploadDFSPIngressEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/ips'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({ type: 'IP' });
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body.value);
        });

        test('Update Egress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.updateEgressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'updateDFSPEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/egress/ips/{epId}'].put(context);

            const expectedArgument = {
                epId: context.params.epId,
                type: 'IP',
                direction: 'EGRESS',
                ...context.request.body.value,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Update Ingress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.updateEgressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'updateDFSPEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/ips/{epId}'].put(context);

            const expectedArgument = {
                epId: context.params.epId,
                type: 'IP',
                direction: 'INGRESS',
                ...context.request.body.value,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Delete Egress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.deleteEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'deleteDFSPEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/egress/ips/{epId}'].delete(context);

            const expectedArgument = {
                epId: context.params.epId,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Delete Ingress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.deleteEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'deleteDFSPEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/ips/{epId}'].delete(context);

            const expectedArgument = {
                epId: context.params.epId,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Upload DFSP Ingress Endpoints with URL calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.uploadIngressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'uploadDFSPIngressEndpoints')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/urls'].post(context);

            const expectedArgument = {
                type: 'URL',
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body);
        });

        test('Update DFSP Ingress Endpoints Url By Id calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.updateIngressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'updateDFSPIngressEndpointsUrlById')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/urls/{epId} '].put(context);

            const expectedArgument = {
                type: 'URL',
                epId: context.params.epId,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body);
        });

        test('Get DFSP Ingress Endpoints with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getIngressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'getDFSPIngressEndpoints')
                .mockImplementation(() => Promise.resolve('mocked response'));

            await handlers['/dfsp/endpoints/ingress/ips'].get(context);

            const expectedArgument = {
                type: 'IP',
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
            expect(context.body).toBe('mocked response');
        });

        test('Get DFSP Egress Endpoint with IP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getEgressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'getDFSPEgressEndpoints')
                .mockImplementation(() => Promise.resolve('mocked response'));

            await handlers['/dfsp/endpoints/egress/ips'].get(context);

            const expectedArgument = {
                type: 'IP',
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
            expect(context.body).toBe('mocked response');
        });

        test('Get DFSP Ingress Endpoints With URL calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getIngressEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'getDFSPIngressEndpoints')
                .mockImplementation(() => Promise.resolve('mocked response'));

            await handlers['/dfsp/endpoints/ingress/urls'].get(context);

            const expectedArgument = {
                type: 'URL',
            };
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
            expect(context.body).toBe('mocked response');
        });

        test('Delete DFSP Ingress Endpoints Url By Id calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.deleteEndpointContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'deleteDFSPIngressEndpointsUrlById')
                .mockImplementation(() => {});

            await handlers['/dfsp/endpoints/ingress/urls/{epId} '].delete(context);

            const expectedArgument = {
                epId: context.params.epId,
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Get Hub Ingress Endpoints calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getHubIngressContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'getHubIngressEndpoints')
                .mockImplementation(() => Promise.resolve('mocked response'));

            await handlers['/hub/endpoints/ingress'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(context.body).toBe('mocked response');
        });

        test('Get Hub Egress Endpoints calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getHubEgressContext;

            const spy = jest
                .spyOn(EndpointsModel.prototype, 'getHubEgressEndpoints')
                .mockImplementation(() => Promise.resolve('mocked response'));

            await handlers['/hub/endpoints/egress'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(context.body).toBe('mocked response');
        });

        test('Get DFSP Details calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getDFSPdetails;

            const spy = jest
                .spyOn(DFSPModel.prototype, 'getDFSPDetails')
                .mockImplementation(() => {});

            await handlers['/dfsp/details'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get All DFSP calls the Endpoints Model with the expected arguments', async () => {
            const context = endpointsResource.getAllDFSP;

            const spy = jest
                .spyOn(DFSPModel.prototype, 'getAllDfsp')
                .mockImplementation(() => {});

            await handlers['/dfsps'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('MonetaryZone tests', () => {
        test('retrieve all monetaryZones', async () => {
            const context = endpointsResource.getMonetaryZones;

            const spy = jest
                .spyOn(MonetaryZoneModel.prototype, 'getMonetaryZones')
                .mockImplementation(() => {});

            await handlers['/monetaryzones'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('retrieve all dfsps from a MonetaryZone', async () => {
            const context = endpointsResource.getDFSPsByMonetaryZone;

            const spy = jest
                .spyOn(DFSPModel.prototype, 'getDFSPsByMonetaryZone')
                .mockImplementation(() => {});

            await handlers['/monetaryzones/{monetaryZoneId}/dfsps'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({
                monetaryZoneId: context.params.monetaryZoneId,
            });
        });
    });

    describe('Metrics', () => {
        test('retrieves metrics from metrics service', async () => {
            const context = endpointsResource.getMetricsContext;

            const spy = jest
                .spyOn(MetricsModel.prototype, 'query')
                .mockImplementation(() => {
                    return {};
                });

            await handlers['/metrics/{metricName}'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({
                ...context.query,
                metricName: context.params.metricName,
            });
        });
        test('handles error returned by metrics service', async () => {
            const context = {
                ...endpointsResource.getMetricsContext,
                response: {},
            };
            const errorResponse = { error: 'Something went wrong' };
            const spy = jest
                .spyOn(MetricsModel.prototype, 'query')
                .mockImplementation(() => errorResponse);

            await handlers['/metrics/{metricName}'].get(context);
            expect(context.body).toBe(errorResponse.error);
            expect(context.response.status).toBe(500);
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({
                ...context.query,
                metricName: context.params.metricName,
            });
        });
    });

    describe('getDfspStatus', () => {
        test('should call DFSPModel.getDfspStatus with correct arguments', async () => {
            const context = endpointsResource.getDfspStatus;

            const spy = jest
                .spyOn(DFSPModel.prototype, 'getDfspStatus')
                .mockImplementation(() => {});

            await handlers['/status'].get(context);

            expect(spy).toHaveBeenCalledWith('test-dfsp-id');
            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('should handle errors correctly', async () => {
            const mockGetDfspStatus = jest
                .fn()
                .mockRejectedValue(new Error('Test error'));
            DFSPModel.prototype.getDfspStatus = mockGetDfspStatus;

            const context = endpointsResource.getDfspStatus;

            await expect(handlers['/status'].get(context)).rejects.toThrow(
                'Test error'
            );
        });
    });
});

describe('Outbound API handlers:', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Transfer tests', () => {
        test('Retrive position hourly', async () => {
            const context = endpointsResource.getPositionContext;

            const spy = jest
                .spyOn(Position.prototype, 'findAll')
                .mockImplementation(() => {});

            await handlers['/hourlyPosition'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfers including fx', async () => {
            const context = endpointsResource.getFxTransfersContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'findAllWithFX')
                .mockImplementation(() => {});

            await handlers['/transfers'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve one transfer including fx', async () => {
            const context = endpointsResource.getTransfersContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'findOne')
                .mockImplementation(() => {});

            await handlers['/transfers/{transferId}'].get(context);

            // could be used for a future test case
            // const expectedArgument = {
            //     'transferId': context.params.transferId
            // };

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfer details', async () => {
            const context = endpointsResource.getTransferDetailsContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'details')
                .mockImplementation(() => {});

            await handlers['/transfers/{transferId}/details'].get(context);

            // could be used for a future test case
            // const expectedArgument = {
            //     'transferId': context.params.transferId
            // };

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfer details error', async () => {
            const context = endpointsResource.getTransferErrorsContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'errors')
                .mockImplementation(() => {});

            await handlers['/errors'].get(context);

            // could be used for a future test case
            // const expectedArgument = {
            //     'transferId': context.params.transferId
            // };

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfer details', async () => {
            const context = endpointsResource.getTransferStatusSummaryContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'statusSummary')
                .mockImplementation(() => {});

            await handlers['/transferStatusSummary'].get(context);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Batch tests', () => {
        test('Retrieve batches', async () => {
            const context = endpointsResource.getBatchesContext;

            const spy = jest
                .spyOn(Batch.prototype, 'findAll')
                .mockImplementation(() => {});

            await handlers['/batches'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve a batch', async () => {
            const context = endpointsResource.getBatchContext;

            const spy = jest
                .spyOn(Batch.prototype, 'findOne')
                .mockImplementation(() => {});

            await handlers['/batches/{batchId}'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve hourly flow', async () => {
            const context = endpointsResource.getHourlyFlowContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'hourlyFlow')
                .mockImplementation(() => {});

            await handlers['/hourlyFlow'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve success rate', async () => {
            const context = endpointsResource.getAvgResponseTimeContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'avgResponseTime')
                .mockImplementation(() => {});

            await handlers['/minuteAverageTransferResponseTime'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve average response time', async () => {
            const context = endpointsResource.getSuccessRateContext;

            const spy = jest
                .spyOn(Transfer.prototype, 'successRate')
                .mockImplementation(() => {});

            await handlers['/minuteSuccessfulTransferPerc'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Fxp Conversions tests', () => {
        test('Get Fxp Conversions', async () => {
            const context = endpointsResource.getFxpConversionsContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'findAll')
                .mockImplementation(() => {});

            await handlers['/fxpConversions'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
        test('Get Fxp Conversion Details', async () => {
            const context = endpointsResource.getFxpConversionDetailsContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'details')
                .mockImplementation(() => {});

            await handlers['/fxpConversions/{conversionId}/details'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
        test('Get Fxp Conversions Status Summary', async () => {
            const context = endpointsResource.getFxpConversionStatusSummaryContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'statusSummary')
                .mockImplementation(() => {});

            await handlers['/fxpConversionsStatusSummary'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
        test('Get Fxp Conversions Error', async () => {
            const context = endpointsResource.getFxpConversionErrorsContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'fxpErrors')
                .mockImplementation(() => {});

            await handlers['/fxpErrors'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
        test('Get Fxp Conversions', async () => {
            const context = endpointsResource.getFxpConversionsSuccessRateContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'successRate')
                .mockImplementation(() => {});

            await handlers['/minuteSuccessfulFxpConversionsPerc'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
        test('Get Fxp Conversions', async () => {
            const context = endpointsResource.getFxpConversionsAvgResponseTimeContext;

            const spy = jest
                .spyOn(FxpConversion.prototype, 'avgResponseTime')
                .mockImplementation(() => {});

            await handlers['/minuteAverageFxpConversionsResponseTime'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Certificates tests', () => {
        test('Get client certificate', async () => {
            const context = endpointsResource.getClientCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/clientCerts'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Create Client CSR', async () => {
            const context = endpointsResource.createClientCSRContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'createClientCSR')
                .mockImplementation(() => {});

            await handlers['/dfsp/clientCerts/csr'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get DSFP CA certificate', async () => {
            const context = endpointsResource.getDFSPCAContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getDFSPCA')
                .mockImplementation(() => {});

            await handlers['/dfsp/ca'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Create DFSP CA CSR', async () => {
            const context = endpointsResource.getDFSPCAContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'createDFSPCA')
                .mockImplementation(() => {});

            await handlers['/dfsp/ca'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Update DFSP CA CSR', async () => {
            const context = endpointsResource.getDFSPCAContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'setDFSPCA')
                .mockImplementation(() => {});

            await handlers['/dfsp/ca'].put(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get DFSP Server certificates', async () => {
            const context = endpointsResource.getDFSPServerCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getDFSPServerCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/serverCerts'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Generate DFSP Server certificates', async () => {
            const context = endpointsResource.getDFSPServerCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'generateServerCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/serverCerts'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get All JWS Certificates', async () => {
            const context = endpointsResource.getAllJWSCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getAllJWSCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/alljwscerts'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get JWS Certificates', async () => {
            const context = endpointsResource.getJWSCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getJWSCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/jwscerts'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get JWS Certificates', async () => {
            const context = endpointsResource.getJWSCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'uploadJWSCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/jwscerts'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get JWS Certificates', async () => {
            const context = endpointsResource.getJWSCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'updateJWSCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/jwscerts'].put(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get JWS Certificates', async () => {
            const context = endpointsResource.getJWSCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'deleteJWSCertificates')
                .mockImplementation(() => {});

            await handlers['/dfsp/jwscerts'].delete(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get Hub Server Certs', async () => {
            const context = endpointsResource.getHubServerCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getHubServerCertificates')
                .mockImplementation(() => {});

            await handlers['/hub/serverCerts'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Get Hub CA Certs', async () => {
            const context = endpointsResource.getHubCACertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'getHubCA')
                .mockImplementation(() => {});

            await handlers['/hub/ca'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Generate All Certificates', async () => {
            const context = endpointsResource.generateAllCertificatesContext;

            const spy = jest
                .spyOn(CertificatesModel.prototype, 'generateAllCerts')
                .mockImplementation(() => {});

            await handlers['/dfsp/allcerts'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
