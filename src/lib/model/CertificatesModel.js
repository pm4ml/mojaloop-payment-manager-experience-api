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
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     * Gets uploaded DFSP CSRs and certificates
     */
    async getCertificates() {
        return this._requests.get('dfsp/clientcerts');
    }

    /**
     *
     * @param body {object}
     */
    uploadClientCSR(body) {
        return this._requests.post('dfsp/clientcerts', body);
    }

    createClientCSR() {
        return this._requests.post('dfsp/clientcerts/csr');
    }

    /**
     * Gets uploaded DFSP CA
     */
    async getDFSPCA() {
        return this._requests.get('dfsp/ca');
    }

    /**
     * Create DFSP CA
     * @param body {object}
     */
    createDFSPCA(body) {
        return this._requests.post('dfsp/ca', body);
    }

    /**
     * Set DFSP CA
     * @param body {object}
     */
    setDFSPCA(body) {
        return this._requests.put('dfsp/ca', body);
    }

    /**
     * Gets Hub CA
     */
    async getHubCA() {
        return this._requests.get('hub/cas');
    }

    getDFSPServerCertificates() {
        return this._requests.get('dfsp/servercerts');
    }


    /**
     *
     * @param body {object}
     */
    generateServerCertificates(body) {
        return this._requests.post('dfsp/servercerts', body);
    }

    /**
     * Gets Hub server certificates
     */
    async getHubServerCertificates() {
        return this._requests.get('hub/servercerts');
    }

    async getAllJWSCertificates() {
        return this._requests.get('dfsp/alljwscerts');
    }

    async getJWSCertificates() {
        return this._requests.get('dfsp/jwscerts');
    }

    uploadJWSCertificates(body) {
        return this._requests.post('dfsp/jwscerts', body);
    }

    updateJWSCertificates(body) {
        return this._requests.put('dfsp/jwscerts', body);
    }

    deleteJWSCertificates() {
        return this._requests.delete('dfsp/jwscerts');
    }


    generateAllCerts() {
        return this._requests.post('dfsp/allcerts');
    }
}

module.exports = CertificatesModel;
