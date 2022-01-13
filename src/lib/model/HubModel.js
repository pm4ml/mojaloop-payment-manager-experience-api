/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const { Requests } = require('@internal/requests');

class HubModel {
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
     *
     * @param opts {Object}
     * @param [opts.direction] {string}
     * @param [opts.type] {string}
     * @param [opts.state] {string}
     */
    getEndpoints(opts) {
        return this._requests.get('hub/endpoints', opts);
    }
}

module.exports = HubModel;
