'use strict';
const {
    EndpointsModel,
    MetricsModel,
    MonetaryZoneModel,
    DFSPModel,
    Transfer,
    Batch,
    FxpConversion,
} = require('@internal/model');

const endpointsResource = require('./resources/endpointsResource');
const handlers = require('../../src/handlers');


describe('Inbound API handlers:', () => {

    afterEach( () => {
        jest.clearAllMocks();
    });

    describe('Endpoints tests', () => {

        test('Create Egress endpoint calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.uploadEgressEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'uploadDFSPEgressEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/egress/ips'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({type: 'IP'});
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body.value);
        });

        test('Create Ingress endpoint calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.uploadIngressEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'uploadDFSPIngressEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/ingress/ips'].post(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({type: 'IP'});
            expect(spy.mock.calls[0][1]).toStrictEqual(context.request.body.value);
        });

        test('Update Egress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.updateEgressEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'updateDFSPEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/egress/ips/{epId}'].put(context);

            const expectedArgument = {
                'epId': context.params.epId,
                'type': 'IP',
                'direction': 'EGRESS',
                ...context.request.body.value
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Update Ingress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.updateEgressEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'updateDFSPEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/ingress/ips/{epId}'].put(context);

            const expectedArgument = {
                'epId': context.params.epId,
                'type': 'IP',
                'direction': 'INGRESS',
                ...context.request.body.value
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Delete Egress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.deleteEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'deleteDFSPEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/egress/ips/{epId}'].delete(context);

            const expectedArgument = {
                'epId': context.params.epId
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });

        test('Delete Ingress endpoint with IP calls the Endpoints Model with the expected arguments', async () => {

            const context = endpointsResource.deleteEndpointContext;

            const spy = jest.spyOn(EndpointsModel.prototype, 'deleteDFSPEndpoints')
                .mockImplementation(() => {});


            await handlers['/dfsp/endpoints/ingress/ips/{epId}'].delete(context);

            const expectedArgument = {
                'epId': context.params.epId
            };

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(expectedArgument);
        });
    });

    describe('MonetaryZone tests', () => {

        test('retrieve all monetaryZones', async () => {

            const context = endpointsResource.getMonetaryZones;

            const spy = jest.spyOn(MonetaryZoneModel.prototype, 'getMonetaryZones')
                .mockImplementation(() => {});


            await handlers['/monetaryzones'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('retrieve all dfsps from a MonetaryZone', async () => {

            const context = endpointsResource.getDFSPsByMonetaryZone;

            const spy = jest.spyOn(DFSPModel.prototype, 'getDFSPsByMonetaryZone')
                .mockImplementation(() => {});


            await handlers['/monetaryzones/{monetaryZoneId}/dfsps'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({monetaryZoneId: context.params.monetaryZoneId});
        });
    });

    describe('Metrics', () => {
        test('retrieves metrics from metrics service', async() => {
            const context = endpointsResource.getMetricsContext;

            const spy = jest.spyOn(MetricsModel.prototype, 'query')
                .mockImplementation(() => { return {}; });


            await handlers['/metrics/{metricName}'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual({
                ...context.query,
                metricName: context.params.metricName
            });
        });
    });
});

describe('Outbound API handlers:', () => {
    afterEach( () => {
        jest.clearAllMocks();
    });

    describe('Transfer tests', () => {
        test('Retrieve transfers including fx', async () => {
            const context = endpointsResource.getFxTransfersContext;

            const spy = jest.spyOn(Transfer.prototype, 'findAllWithFX')
                .mockImplementation(() => {});

            await handlers['/transfers'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve one transfer including fx', async () => {
            const context = endpointsResource.getTransfersContext;

            const spy = jest.spyOn(Transfer.prototype, 'findOne')
                .mockImplementation(() => {});

            await handlers['/transfers/{transferId}'].get(context);

            const expectedArgument = {
                'transferId': context.params.transferId
            };

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfer details', async () => {
            const context = endpointsResource.getTransferDetailsContext;

            const spy = jest.spyOn(Transfer.prototype, 'details')
                .mockImplementation(() => {});

            await handlers['/transfers/{transferId}/details'].get(context);

            const expectedArgument = {
                'transferId': context.params.transferId
            };

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve transfer details', async () => {
            const context = endpointsResource.getTransferStatusSummaryContext;

            const spy = jest.spyOn(Transfer.prototype, 'statusSummary')
                .mockImplementation(() => {});

            await handlers['/transferStatusSummary'].get(context);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Batch tests', () => {
        test('Retrieve batches', async () => {
            const context = endpointsResource.getBatchesContext;

            const spy = jest.spyOn(Batch.prototype, 'findAll')
                .mockImplementation(() => {});

            await handlers['/batches'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve a batch', async () => {
            const context = endpointsResource.getBatchContext;

            const spy = jest.spyOn(Batch.prototype, 'findOne')
                .mockImplementation(() => {});

            await handlers['/batches/{batchId}'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve hourly flow', async () => {
            const context = endpointsResource.getHourlyFlowContext;

            const spy = jest.spyOn(Transfer.prototype, 'hourlyFlow')
                .mockImplementation(() => {});

            await handlers['/hourlyFlow'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve success rate', async () => {
            const context = endpointsResource.getAvgResponseTimeContext;

            const spy = jest.spyOn(Transfer.prototype, 'avgResponseTime')
                .mockImplementation(() => {});

            await handlers['/minuteAverageTransferResponseTime'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });

        test('Retrieve average response time', async () => {
            const context = endpointsResource.getSuccessRateContext;

            const spy = jest.spyOn(Transfer.prototype, 'successRate')
                .mockImplementation(() => {});

            await handlers['/minuteSuccessfulTransferPerc'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Fxp Conversions tests', () => {
        test('Get Fxp Conversions', async () => {
            const context = endpointsResource.getFxpConversionsContext;

            const spy = jest.spyOn(FxpConversion.prototype, 'findAll')
                .mockImplementation(() => {});

            await handlers['/fxpConversions'].get(context);

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

});
