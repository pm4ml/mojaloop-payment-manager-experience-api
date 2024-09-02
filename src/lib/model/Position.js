/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const { NotImplementedError } = require('@internal/utils');
const mock = require('./mock');

class Position {
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
     * @param [opts.hoursPrevious] {number}
     */
    async findAll(opts) {
        if (this.mockData) {
            return mock.getPositions(opts);
        }
        throw new NotImplementedError();
    }
}

module.exports = Position;
