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

const statuses = ['OPEN', 'ON TRACK', 'HAS ERRORS', 'OVERDUE'];

const seed = faker.random.number();

const getTransferTotals = () => {
    return {
        netValue: fakeAmount(),
        currency: faker.random.arrayElement(currencies),
    };
};

const getBatch = (opts, state) => {
    const date = opts.date || faker.date.recent(20);
    const distinctCurrencies = faker.random.number({ min: 1, max: currencies.length });
    const transferTotals = [...Array(distinctCurrencies)].map(getTransferTotals);
    const startOfDay = new Date(date);
    startOfDay.setHours(
        faker.random.number({ min: 0, max: 12 }),
        faker.random.number({ min: 0, max: 59 }),
        faker.random.number({ min: 0, max: 59 }),
        0);
    const endOfDay = new Date(date);
    endOfDay.setHours(
        faker.random.number({ min: 14, max: 23 }),
        faker.random.number({ min: 0, max: 59 }),
        faker.random.number({ min: 0, max: 59 }),
        0);
    let status;
    if (state && state.statuses) {
        let openIndex = state.statuses.indexOf('OPEN');
        if (openIndex === -1) {
            status = faker.random.arrayElement(state.statuses);
        } else {
            status = 'OPEN';
            delete state.statuses.splice(openIndex, 1);
        }
    } else {
        status = faker.random.arrayElement(statuses);
    }
    const batch = {
        id: opts.id || faker.random.number({ min: 1e2, max: 1e6 }),
        status,
        transferCount: faker.random.number({ min: 1e2, max: 1e6 }),
        transferTotals,
        errorCount: faker.random.number({ min: 0, max: 5 }),
        startingTimestamp: startOfDay.toISOString(),
    };
    if (status !== 'OPEN') {
        batch.closingTimestamp = endOfDay.toISOString();
    }
    return batch;
};

/**
 *
 * @param opts {Object}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 */
const getBatches = (opts) => {
    const batches = [];
    faker.seed(seed);
    const startDate = opts.startTimestamp ? new Date(opts.startTimestamp) : faker.date.recent(20);
    const endDate = opts.endTimestamp ? new Date(opts.endTimestamp) : faker.date.between(startDate, new Date());

    const state = {
        statuses: [...statuses],
    };

    for (const d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        batches.push(getBatch({ date: d }, state));
    }
    return batches;
};

module.exports = {
    getBatches,
    getBatch,
};
