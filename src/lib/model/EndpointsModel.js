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

class EndpointsModel {
    constructor(props) {
        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     * Get DFSP Egress Endpoints to MCM Server
     */
    async getDFSPEgressEndpoints(opts) {
        return this._requests.get('dfsp/endpoints',{
            direction: 'EGRESS',
            type: opts.type
        });
    }

    /**
     * Upload DFSP Egress Endpoints to MCM Server
     */
    async uploadDFSPEgressEndpoints(opts, body) {
        let request;
        if(opts.type === 'IP'){
            request = {
                address: body.address,
                ports: body.ports
            };
        } else {
            request = {
                url: body.address
            };
        }
        request.type = opts.type;
        request.direction = 'EGRESS';
        return this._requests.post('dfsp/endpoints',request);
    }

    /**
     * Get DFSP Igress Endpoints to MCM Server
     */
    async getDFSPIngressEndpoints(opts) {
        return this._requests.get('dfsp/endpoints',{
            direction: 'INGRESS',
            type: opts.type
        });
    }

    /**
     * Update DFSP Egress Endpoints to MCM Server
     */
    async updateDFSPEndpoints(opts) {
        let request;
        if(opts.type === 'IP'){
            request = {
                address: opts.address,
                ports: opts.ports
            };
        } else {
            request = {
                url: opts.address
            };
        }
        request.type = opts.type;
        request.direction = opts.direction;
        return this._requests.put(`dfsp/endpoints/${opts.epId}`,request);
    }

    /**
     * Delete DFSP Egress Endpoints in MCM Server
     */
    async deleteDFSPEndpoints(opts) {
        return this._requests.delete(`dfsp/endpoints/${opts.epId}`);
    }

    /**
     * Upload DFSP Ingress Endpoints to MCM Server
     */
    async uploadDFSPIngressEndpoints(opts,body) {
        let request;
        if(opts.type === 'IP'){
            request = {
                address: body.address,
                ports: body.ports
            };
        } else {
            request = {
                url: body.address
            };
        }
        request.type = opts.type;
        request.direction = 'INGRESS';
        return this._requests.post('dfsp/endpoints',request);
    }

    /**
     * Update DFSP Ingress Endpoints to MCM Server
     */
    async updateDFSPIngressEndpointsUrlById(opts,body) {
        let request;
        if(opts.type === 'IP'){
            request = {
                address: body.ip,
                ports: body.ports
            };
        } else if(opts.type === 'URL'){
            request = {
                url: body.address
            };
        }
        return this._requests.put(`dfsp/endpoints/${opts.epId}`,request);
    }

    /**
     * Update DFSP Ingress Endpoints to MCM Server
     */
    async deleteDFSPIngressEndpointsUrlById(opts) {
        return this._requests.delete(`dfsp/endpoints/${opts.epId}`);
    }



    /**
     * Get Hub Ingress Endpoints from MCM Server
     */
    async getHubIngressEndpoints() {
        return this._requests.get('hub/endpoints',{
            direction: 'INGRESS',
            state: 'NEW'
        });
    }

    /**
     * Get Hub Egress Endpoints from MCM Server
     */
    async getHubEgressEndpoints() {
        return this._requests.get('hub/endpoints',{
            direction: 'EGRESS',
            state: 'NEW'
        });
    }

}

module.exports = EndpointsModel;
