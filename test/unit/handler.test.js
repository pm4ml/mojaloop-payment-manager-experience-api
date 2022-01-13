'use strict';
const {
    EndpointsModel,
    MetricsModel,
    MonetaryZoneModel,
    DFSPModel,
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
