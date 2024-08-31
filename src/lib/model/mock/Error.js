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

const directions = ['INBOUND', 'OUTBOUND'];
const transferTypes = ['P2P'];
const errorTypes = [
    'INVALID SIGNATURE',
    'PAYER FSP INSUFFICIENT LIQUIDITY',
    'PAYER REJECTION',
    'PAYER REJECTED TXN REQUEST',
    'PAYER LIMIT ERROR',
    'PAYEE FSP INSUFFICIENT LIQUIDITY',
    'PAYEE REJECTED QUOTE',
    'PAYEE FSP REJECTED QUOTE',
    'PAYEE REJECTED TXN',
    'PAYEE FSP REJECTED TXN',
    'PAYEE UNSUPPORTED CURRENCY',
    'PAYEE LIMIT ERROR',
];

const getError = (opts) => {
    const startDate = opts.startTimestamp ? new Date(opts.startTimestamp) : faker.date.recent(20);
    const endDate = opts.endTimestamp ? new Date(opts.endTimestamp) : faker.date.between(startDate, new Date());

    return {
        id: opts.id || faker.random.number({ min: 1e2, max: 1e6 }),
        direction: faker.random.arrayElement(directions),
        type: faker.random.arrayElement(transferTypes),
        currency: faker.random.arrayElement(currencies),
        value: fakeAmount(),
        errorType: faker.random.arrayElement(errorTypes),
        committedDate: faker.date.between(startDate, endDate).toISOString(),
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.startTimestamp] {string}
 * @param [opts.endTimestamp] {string}
 */
const getErrors = (opts) => {
    const count = faker.random.number({ min: 5, max: 11 });
    return [...Array(count)].map(() => getError(opts));
};

module.exports = {
    getErrors,
};
