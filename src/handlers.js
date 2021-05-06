/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                         *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - james.bush@modusbox.com                             *
 *       Juan Correa - juan.correa@modusbox.com                           *
 **************************************************************************/

'use strict';

const {
    Batch,
    Transfer,
    Position,
    DFSPModel,
    CertificatesModel,
    MonetaryZoneModel,
    MetricsModel,
    HubModel,
    EndpointsModel,
} = require('@internal/model');


const healthCheck = async (ctx) => {
    ctx.body = JSON.stringify({'status':'ok'});
};

const getEnvironmentDfspStatus = async (ctx) => {
    const envId = ctx.params.envId;
    const dfspId = ctx.state.conf.dfspId;
    const { managementEndpoint } = ctx.state.conf;
    const dfspModel = new DFSPModel({
        logger: ctx.state.logger,
        managementEndpoint,
        mockData: true
    });
    ctx.body = await dfspModel.getEnvironmentDfspStatus(envId, dfspId);
};

const getBatches = async (ctx) => {
    const { startTimestamp, endTimestamp } = ctx.query;
    const batch = new Batch({
        ...ctx.state.conf,
        mockData: true
    });
    ctx.body = batch.findAll({ startTimestamp, endTimestamp });
};

const getBatch = async (ctx) => {
    const batch = new Batch({
        ...ctx.state.conf,
        mockData: true
    });
    ctx.body = batch.findOne(ctx.params.batchId);
};

const getTransfers = async (ctx) => {
    const { id, startTimestamp, endTimestamp, institution, status, batchId } = ctx.query;
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.findAll({ id, startTimestamp, endTimestamp, institution, status, batchId });
};

const getTransferStatusSummary = async (ctx) => {
    const { startTimestamp, endTimestamp } = ctx.query;
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.statusSummary({ startTimestamp, endTimestamp });
};

const getTransfer = async (ctx) => {
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.findOne(ctx.params.transferId);
};

const getTransferDetails = async (ctx) => {
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.details(ctx.params.transferId);
};

const getErrors = async (ctx) => {
    const { startTimestamp, endTimestamp } = ctx.query;
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.errors({ startTimestamp, endTimestamp });
};

const getHourlyPosition = async (ctx) => {
    const { hoursPrevious } = ctx.query;
    const position = new Position(ctx.state.conf);
    ctx.body = await position.findAll({ hoursPrevious });
};

const getHourlyFlow = async (ctx) => {
    const { hoursPrevious } = ctx.query;
    const transfer = new Transfer(ctx.state.conf);
    ctx.body = await transfer.hourlyFlow({ hoursPrevious });
};

const getTransfersSuccessRate = async (ctx) => {
    const { minutePrevious } = ctx.query;
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.successRate({ minutePrevious });
};

const getTransfersAvgResponseTime = async (ctx) => {
    const { minutePrevious } = ctx.query;
    const transfer = new Transfer({ ...ctx.state.conf, logger: ctx.state.logger });
    ctx.body = await transfer.avgResponseTime({ minutePrevious });
};

const getMetrics = async (ctx) => {
    const {
        startTimestamp,
        endTimestamp,
        aggregateDurationSeconds,
        resolutionSeconds,
        metricType
    } = ctx.query;

    const metrics = new MetricsModel({ ...ctx.state.conf, logger: ctx.state.logger });

    const result = await metrics.query({
        startTimestamp,
        endTimestamp,
        metricName: ctx.params.metricName,
        metricType,
        aggregateDurationSeconds,
        resolutionSeconds
    });

    if(result.error) {
        ctx.body = result.error;
        ctx.response.status = 500;
        return;
    }

    ctx.body = result;
};

const getDFSPDetails = async(ctx) => {
    const { dfspId, managementEndpoint } = ctx.state.conf;
    const dfspModel = new DFSPModel({
        envId: ctx.params.envId,
        dfspId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await dfspModel.getDFSPDetails();
};

const getAllDfsp = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const dfspModel = new DFSPModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await dfspModel.getAllDfsp();
};

const getDFSPEgressEndpointsIps = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.getDFSPEgressEndpoints({ type: 'IP' });

};

const uploadDFSPEgressEndpointsIps = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.uploadDFSPEgressEndpoints({ type: 'IP' }, ctx.request.body.value);
};

/**
 * Update existing dfsp endpoint 
 * @param {*} ctx 
 */
const updateDFSPEgressEndpointsIp = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.updateDFSPEndpoints({ epId: ctx.params.epId, type: 'IP', direction : 'EGRESS',...ctx.request.body.value });
};

/**
 * Update existing dfsp endpoint
 * @param {*} ctx
 */
const updateDFSPIngressEndpointsIp = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.updateDFSPEndpoints({ epId: ctx.params.epId, type: 'IP', direction : 'INGRESS',...ctx.request.body.value });
};

const deleteDFSPEndpointsIp = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.deleteDFSPEndpoints({ epId: ctx.params.epId });
};

const getDFSPIngressEndpointsIps = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.getDFSPIngressEndpoints({ type: 'IP' });
};

const uploadDFSPIngressEndpointsIps = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.uploadDFSPIngressEndpoints({ type:'IP' }, ctx.request.body.value);
};

const getDFSPIngressEndpointsUrls = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.getDFSPIngressEndpoints({ type: 'URL' });
};

const uploadDFSPIngressEndpointsUrls = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.uploadDFSPIngressEndpoints({ type:'URL' }, ctx.request.body);
};

/**
 * Update DFSP Ingress URL endpoint by Id
 * @param {*} ctx 
 */
const updateDFSPIngressEndpointsUrlById = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.updateDFSPIngressEndpointsUrlById({ type:'URL', epId: ctx.params.epId }, ctx.request.body);
};

/**
 * Update DFSP Ingress URL endpoint by Id
 * @param {*} ctx 
 */
const deleteDFSPIngressEndpointsUrlById = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.deleteDFSPIngressEndpointsUrlById({ epId: ctx.params.epId });
};

const getHubIngressEndpoints = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.getHubIngressEndpoints();
};

const getHubEgressEndpoints = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const endpointsModel = new EndpointsModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await endpointsModel.getHubEgressEndpoints();
};

const uploadClientCSR = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.paramd.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.uploadClientCSR(ctx.request.body);
};

const createClientCSR = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.createClientCSR();
};

const getClientCertificate = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getCertificates();
};

const getDFSPCA = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getDFSPCA();
};

const uploadDFSPCA = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.uploadDFSPCA(ctx.request.body);
};

const getAllJWSCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getAllJWSCertificates();
};

const getJWSCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getJWSCertificates();
};

const uploadJWSCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.uploadJWSCertificates(ctx.request.body);
};

const updateJWSCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.updateJWSCertificates(ctx.request.body);
};

const deleteJWSCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.deleteJWSCertificates();
};

const getHubCA = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getHubCA();
};

const getDFSPServerCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getDFSPServerCertificates();
};

const uploadServerCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.uploadServerCertificates(ctx.request.body);
};

const getHubServerCertificates = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.getHubServerCertificates();
};

const getEnvironments = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const hubModel = new HubModel({
        managementEndpoint,
        logger: ctx.state.logger,
    });
    const responseData = await hubModel.getEnvironments();
    ctx.body = responseData;
};

const getMonetaryZones = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const monetaryZoneModel = new MonetaryZoneModel({
        managementEndpoint,
        logger: ctx.state.logger,
    });
    const responseData = await monetaryZoneModel.getMonetaryZones();
    ctx.body = responseData;
};

const getDfspsByMonetaryZones = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const dfspModel = new DFSPModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    const responseData = await dfspModel.getDFSPsByMonetaryZone({monetaryZoneId: ctx.params.monetaryZoneId});
    ctx.body = responseData;
};

const generateAllCerts = async(ctx) => {
    const { managementEndpoint } = ctx.state.conf;
    const certsModel = new CertificatesModel({
        envId: ctx.params.envId,
        managementEndpoint,
        logger: ctx.state.logger,
    });
    ctx.body = await certsModel.generateAllCerts();
};



module.exports = {
    '/health': {
        get: healthCheck
    },
    '/environments/{envId}/status': {
        get: getEnvironmentDfspStatus,
    },
    '/batches': {
        get: getBatches,
    },
    '/batches/{batchId}': {
        get: getBatch,
    },
    '/batches/{batchId}/transfers': {
        get: getTransfers,
    },
    '/transfers': {
        get: getTransfers,
    },
    '/transfers/{transferId}': {
        get: getTransfer,
    },
    '/transfers/{transferId}/details': {
        get: getTransferDetails,
    },
    '/transferStatusSummary': {
        get: getTransferStatusSummary,
    },
    '/errors': {
        get: getErrors,
    },
    '/hourlyPosition': {
        get: getHourlyPosition,
    },
    '/hourlyFlow': {
        get: getHourlyFlow,
    },
    '/minuteSuccessfulTransferPerc': {
        get: getTransfersSuccessRate,
    },
    '/minuteAverageTransferResponseTime': {
        get: getTransfersAvgResponseTime,
    },
    '/metrics/{metricName}': {
        get: getMetrics,
    },
    '/environments/{envId}/dfsp/details': {
        get: getDFSPDetails,
    },
    '/environments/{envId}/dfsps': {
        get: getAllDfsp,
    },    
    '/environments/{envId}/dfsp/endpoints/egress/ips': {
        get: getDFSPEgressEndpointsIps,
        post: uploadDFSPEgressEndpointsIps,
    },    
    '/environments/{envId}/dfsp/endpoints/egress/ips/{epId}': {
        put: updateDFSPEgressEndpointsIp,
        delete: deleteDFSPEndpointsIp,
    },
    '/environments/{envId}/dfsp/endpoints/ingress/ips': {
        get: getDFSPIngressEndpointsIps,
        post: uploadDFSPIngressEndpointsIps,
    } ,    
    '/environments/{envId}/dfsp/endpoints/ingress/ips/{epId}': {
        put: updateDFSPIngressEndpointsIp,
        delete: deleteDFSPEndpointsIp,
    } ,
    '/environments/{envId}/dfsp/endpoints/ingress/urls': {
        get: getDFSPIngressEndpointsUrls,
        post: uploadDFSPIngressEndpointsUrls,
    } ,    
    '/environments/{envId}/dfsp/endpoints/ingress/urls/{epId} ': {
        put: updateDFSPIngressEndpointsUrlById,
        delete: deleteDFSPIngressEndpointsUrlById,
    } ,
    '/environments/{envId}/hub/endpoints/ingress': {
        get: getHubIngressEndpoints,
    },
    '/environments/{envId}/hub/endpoints/egress': {
        get: getHubEgressEndpoints,
    },
    '/monetaryzones': {
        get: getMonetaryZones
    },
    '/environments': {
        get: getEnvironments,
    },
    '/environments/{envId}/monetaryzones/{monetaryZoneId}/dfsps': {
        get: getDfspsByMonetaryZones
    },
    '/environments/{envId}/dfsp/clientCerts': {
        get: getClientCertificate,
        post: uploadClientCSR,
    },
    '/environments/{envId}/dfsp/clientCerts/csr': {
        post: createClientCSR,
    },
    '/environments/{envId}/dfsp/ca': {
        get: getDFSPCA,
        post: uploadDFSPCA,
    },
    '/environments/{envId}/hub/ca': {
        get: getHubCA,
    },
    '/environments/{envId}/dfsp/serverCerts': {
        get: getDFSPServerCertificates,
        post: uploadServerCertificates,
    },
    '/environments/{envId}/hub/serverCerts': {
        get: getHubServerCertificates,
    },
    '/environments/{envId}/dfsp/alljwscerts': {
        get: getAllJWSCertificates,
    },
    '/environments/{envId}/dfsp/jwscerts': {
        get: getJWSCertificates,
        post: uploadJWSCertificates,
        put: updateJWSCertificates,
        delete: deleteJWSCertificates,
    },
    '/environments/{envId}/dfsp/allcerts': {
        post: generateAllCerts,
    },
};
