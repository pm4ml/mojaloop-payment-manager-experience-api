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

const getPosition = (currentDate, hour) => {
    const timestamp = new Date(currentDate);
    timestamp.setHours(timestamp.getHours() - hour);

    return {
        // currency: faker.random.arrayElement(currencies),
        position: fakeAmount(),
        reserved: fakeAmount(),
        committed: fakeAmount(),
        liquidity: fakeAmount(),
        timestamp: timestamp.toISOString(),
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.hoursPrevious] {number}
 */
const getPositions = (opts) => {
    const hoursPrevious = opts.hoursPrevious || 1;
    const currentDate = new Date();
    return [...Array(hoursPrevious)].map((_, hour) => getPosition(currentDate, hour));
};

module.exports = {
    getPositions,
};
