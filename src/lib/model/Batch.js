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

const mock = require('./mock');

class Batch {
    /**
     *
     * @param props {object}
     * @param [props.mockData] {boolean}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this.mockData = props.mockData;
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.startTimestamp] {string}
     * @param [opts.endTimestamp] {string}
     */
    findAll(opts) {
        if (this.mockData) {
            return mock.getBatches(opts);
        }
        return mock.getBatches(opts);
        //throw new NotImplementedError();
    }

    /**
     *
     * @param id {number}
     */
    findOne(id) {
        if (this.mockData) {
            return mock.getBatch({ id });
        }
        return mock.getBatch({ id });
        //throw new NotImplementedError();
    }
}

module.exports = Batch;
