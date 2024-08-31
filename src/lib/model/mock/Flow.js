/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const { fakeAmount } = require('./common');

const getFlow = (currentDate, hour) => {
    const timestamp = new Date(currentDate);
    timestamp.setHours(timestamp.getHours() - hour);

    return {
    //    currency: faker.random.arrayElement(currencies),
        inbound: fakeAmount(),
        outbound: fakeAmount(),
        timestamp: timestamp.toISOString(),
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.hoursPrevious] {number}
 */
const getFlows = (opts) => {
    const hoursPrevious = opts.hoursPrevious || 1;
    const currentDate = new Date();
    return [...Array(hoursPrevious)].map((_, hour) => getFlow(currentDate, hour));
};

module.exports = {
    getFlows,
};
