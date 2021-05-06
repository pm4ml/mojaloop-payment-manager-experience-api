/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                   *
 **************************************************************************/

const { Requests } = require('@internal/requests');

class DFSPModel {
    /**
     *
     * @param props {object}
     * @param props.envId {string}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this._envId = props.envId;
        this._dfspId = props.dfspId,
        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     *
     * @param envId {string}
     * @param dfspId {string}
     */
    async getEnvironmentDfspStatus(envId, dfspId) {

        let dfspStatus = this._requests.get(`environments/${envId}/dfsps/${dfspId}/status`);

        return dfspStatus;
    }

    getDFSPDetails() {
        return this._requests.get(`environments/${this._envId}/dfsp`);
    }

    getAllDfsp(opts) {
        return this._requests.get(`environments/${this._envId}/dfsps`, opts);
    }    
    
    /**
     * 
     * @param [opts.monetaryZoneId] {string}
     */
    getDFSPsByMonetaryZone(opts) {
        return this._requests.get(`environments/${this._envId}/monetaryzones/${opts.monetaryZoneId}/dfsps`, opts);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.direction] {string}
     * @param [opts.type] {string}
     * @param [opts.state] {string}
     */
    getEndpoints(opts) {
        return this._requests.get(`environments/${this._envId}/dfsp/endpoints`, opts);
    }

    /**
     * Creates dfsp endpoint item
     *
     * @param endpoint {Object}
     * @param endpoint.direction {Enum 'INGRESS' or 'EGRESS'}
     * @param endpoint.type {Enum 'IP' or 'URL'}
     * @param [endpoint.ports] {Array<number>}
     * @param endpoint.address {string}
     */
    createEndpoints(endpoint) {
        return this._requests.post(`environments/${this._envId}/dfsp/endpoints`, endpoint);
        
    }
}

module.exports = DFSPModel;
