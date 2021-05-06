/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 *                                                                        *
 *  CONTRIBUTORS:                                                         *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

const util = require('util');
const { Requests } = require('@internal/requests');
const mock = require('./mock');

class Transfer {
    /**
     *
     * @param props {object}
     * @param [props.mockData] {boolean}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this.mockData = props.mockData;
        this.logger = props.logger;

        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.startTimestamp] {string}
     * @param [opts.endTimestamp] {string}
     * @param [opts.institution] {string}
     * @param [opts.batchId] {number}
     * @param [opts.status] {string}
     */
    findAll(opts) {
        if (this.mockData) {
            return mock.getTransfers(opts);
        }
        return this._requests.get('transfers', opts);
    }

    /**
     *
     * @param id {string}
     */
    findOne(id) {
        if (this.mockData) {
            return mock.getTransfer({ id });
        }
        return this._requests.get(`transfers/${id}`);
    }

    /**
     *
     * @param id {string}
     */
    details(id) {
        if (this.mockData) {
            return mock.getTransferDetails({ id });
        }
        return this._requests.get(`transfers/${id}/details`);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.minutePrevious] {number}
     */
    successRate(opts) {
        if (this.mockData) {
            return mock.getTransfersSuccessRate(opts);
        }
        return this._requests.get('minuteSuccessfulTransferPerc', opts);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.minutePrevious] {number}
     */
    avgResponseTime(opts) {
        if (this.mockData) {
            return mock.getTransfersAvgResponseTime(opts);
        }
        return this._requests.get('minuteAverageTransferResponseTime', opts);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.startTimestamp] {string}
     * @param [opts.endTimestamp] {string}
     */
    statusSummary(opts) {
        if (this.mockData) {
            return mock.getTransferStatusSummary(opts);
        }
        return this._requests.get('transferStatusSummary', opts);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.hoursPrevious] {number}
     */
    hourlyFlow(opts) {
        if (this.mockData) {
            return mock.getFlows(opts);
        }
        return this._requests.get('hourlyFlow', opts);
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.startTimestamp] {string}
     * @param [opts.endTimestamp] {string}
     */
    errors(opts) {
        try {
            if (this.mockData) {
                return mock.getErrors(opts);
            }

            return this._requests.get('transferErrors', opts);
        }
        catch(err) {
            this.logger.log(`Error getting transfer errors: ${err.stack || util.inspect(err)}`);
            throw err;
        }
    }

}

module.exports = Transfer;
