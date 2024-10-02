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
const getFxpConversion = (opts) => {
    const startDate = opts.startTimestamp ? new Date(opts.startTimestamp) : faker.date.recent(20);
    const endDate = opts.endTimestamp ? new Date(opts.endTimestamp) : faker.date.between(startDate, new Date());

    return {
        conversionId: opts.id || faker.random.uuid(),
        batchId: opts.batchId || faker.random.number({ min: 10, max: 1e6 }),
        institution: opts.institution || faker.random.alphaNumeric(6).toUpperCase(),
        direction: faker.random.arrayElement(directions),
        currency: faker.random.arrayElement(currencies),
        amount: fakeAmount(),
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
const getFxpConversions = (opts) => {
    const count = faker.random.number({ min: 10, max: 1e4 });
    return [...Array(count)].map(() => getFxpConversion(opts));
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
const getFxpConversionDetails = (opts) => {
    return {
        determiningTransferId:opts.id || faker.random.uuid(),
        conversionId: opts.id || faker.random.uuid(),
        conversionRequestId: opts.id || faker.random.uuid(),
        sourceAmount: { amount: fakeAmount(), currency: currencies(faker.random.arrayElement(currencies))},
        targetAmount: { amount: fakeAmount(), currency: currencies(faker.random.arrayElement(currencies))},
        status: opts.status || faker.random.arrayElement(statuses),
        dfspInstitution: opts.institution || faker.random.alphaNumeric(6).toUpperCase(),
    };
};

/**
 *
 * @param opts {Object}
 * @param [opts.minutePrevious] {number}
 */
const getFxpConversionsSuccessRate = (opts) => {
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
const getFxpConversionsAvgResponseTime = (opts) => {
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
const getFxpConversionStatusSummary = (opts) => {
    return statuses.map((status) => ({
        status,
        count: faker.random.number({ min: 10, max: 1e4 }),
    }));
};



module.exports = {
    getFxpConversions,
    getFxpConversion,
    getFxpConversionDetails,
    getFxpConversionsSuccessRate,
    getFxpConversionsAvgResponseTime,
    getFxpConversionStatusSummary,
};
