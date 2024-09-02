/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const faker = require('faker');
const { currencies, fakeAmount } = require('./common');

const statuses = ['SUCCESS', 'PENDING', 'ERROR'];
const directions = ['INBOUND', 'OUTBOUND'];
const types = ['P2P'];


/**
 *
 * @param opts {Object}
 * @param [opts.id] {string}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 * @param [opts.institution] {string}
 * @param [opts.status] {string}
 * @param [opts.batchId] {number}
 */
const getTransfer = (opts) => {
    const startDate = opts.startTimestamp ? new Date(opts.startTimestamp) : faker.date.recent(20);
    const endDate = opts.endTimestamp ? new Date(opts.endTimestamp) : faker.date.between(startDate, new Date());

    return {
        id: opts.id || faker.random.uuid(),
        batchId: opts.batchId || faker.random.number({ min: 10, max: 1e6 }),
        institution: opts.institution || faker.random.alphaNumeric(6).toUpperCase(),
        direction: faker.random.arrayElement(directions),
        currency: faker.random.arrayElement(currencies),
        value: fakeAmount(),
        type: faker.random.arrayElement(types),
        status: opts.status || faker.random.arrayElement(statuses),
        initiatedTimestamp: faker.date.between(startDate, endDate).toISOString(),
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 * @param [opts.institution] {string}
 * @param [opts.status] {string}
 */
const getTransfers = (opts) => {
    const count = faker.random.number({ min: 10, max: 1e4 });
    return [...Array(count)].map(() => getTransfer(opts));
};

/**
 *
 * @param opts {Object}
 * @param [opts.id] {string}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 * @param [opts.institution] {string}
 * @param [opts.status] {string}
 * @param [opts.batchId] {number}
 */
const getTransferDetails = (opts) => {
    return {
        id: opts.id || faker.random.uuid(),
        confirmationNumber: faker.random.number({ min: 10, max: 1e6 }),
        amount: fakeAmount(),
        sender: faker.name.findName(),
        recipient: faker.name.findName(),
        details: faker.lorem.paragraph(),
        status: opts.status || faker.random.arrayElement(statuses)
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.minutePrevious] {number}
 */
const getTransfersSuccessRate = (opts) => {
    const minutePrevious = opts.minutePrevious || 1;
    const currentDate = new Date();
    return [...Array(minutePrevious)].map((_, minute) => {
        const timestamp = new Date(currentDate);
        timestamp.setMinutes(timestamp.getMinutes() - minute);
        return {
            percentage: faker.random.number({ min: 0, max: 100 }),
            timestamp: timestamp.toISOString(),
        };
    });
};

/**
 *
 * @param opts {Object}
 * @param [opts.minutePrevious] {number}
 */
const getTransfersAvgResponseTime = (opts) => {
    const minutePrevious = opts.minutePrevious || 1;
    const currentDate = new Date();
    return [...Array(minutePrevious)].map((_, minute) => {
        const timestamp = new Date(currentDate);
        timestamp.setMinutes(timestamp.getMinutes() - minute);
        return {
            averageResponseTime: faker.random.number({ min: 5, max: 1e3 }),
            timestamp: timestamp.toISOString(),
        };
    });
};

/**
 *
 * @param opts {Object}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 */
/* eslint-disable no-unused-vars */
const getTransferStatusSummary = (opts) => {
    return statuses.map((status) => ({
        status,
        count: faker.random.number({ min: 10, max: 1e4 }),
    }));
};



module.exports = {
    getTransfers,
    getTransfer,
    getTransferDetails,
    getTransfersSuccessRate,
    getTransfersAvgResponseTime,
    getTransferStatusSummary,
};
