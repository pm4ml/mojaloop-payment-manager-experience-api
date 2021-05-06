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

class CertificatesModel {
    /**
     *
     * @param props {object}
     * @param props.envId {string}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this._envId = props.envId;
        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     * Gets uploaded DFSP CSRs and certificates
     */
    async getCertificates() {
        return this._requests.get(`environments/${this._envId}/dfsp/clientcerts`);
    }

    /**
     *
     * @param body {object}
     */
    uploadClientCSR(body) {
        return this._requests.post(`environments/${this._envId}/dfsp/clientcerts`, body);
    }

    /**
     *
     * @param body {object}
     */
    createClientCSR() {
        return this._requests.post(`environments/${this._envId}/dfsp/clientcerts/csr`);
    }

    /**
     * Gets uploaded DFSP CA
     */
    async getDFSPCA() {
        return this._requests.get(`environments/${this._envId}/dfsp/ca`);
    }

    /**
     * Upload DFSP CA
     * @param body {object}
     */
    uploadDFSPCA(body) {
        return this._requests.post(`environments/${this._envId}/dfsp/ca`, body);
    }

    /**
     * Gets Hub CA
     */
    async getHubCA() {
        return this._requests.get(`environments/${this._envId}/hub/cas`);
    }

    /**
     *
     * @param body {object}
     */
    getDFSPServerCertificates() {
        return this._requests.get(`environments/${this._envId}/dfsp/servercerts`);
    }


    /**
     *
     * @param body {object}
     */
    uploadServerCertificates(body) {
        return this._requests.post(`environments/${this._envId}/dfsp/servercerts`, body);
    }

    /**
     * Gets Hub server certificates
     */
    async getHubServerCertificates() {
        return this._requests.get(`environments/${this._envId}/hub/servercerts`);
    }

    async getAllJWSCertificates() {
        return this._requests.get(`environments/${this._envId}/dfsp/alljwscerts`);
    }

    async getJWSCertificates() {
        return this._requests.get(`environments/${this._envId}/dfsp/jwscerts`);
    }

    uploadJWSCertificates(body) {
        return this._requests.post(`environments/${this._envId}/dfsp/jwscerts`, body);
    }

    updateJWSCertificates(body) {
        return this._requests.put(`environments/${this._envId}/dfsp/jwscerts`, body);
    }

    deleteJWSCertificates() {
        return this._requests.delete(`environments/${this._envId}/dfsp/jwscerts`);
    }


    generateAllCerts() {
        return this._requests.post(`environments/${this._envId}/dfsp/allcerts`);
    }
}

module.exports = CertificatesModel;
