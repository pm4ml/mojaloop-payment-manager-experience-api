const { getBatches, getBatch } = require('./Batch');
const {
    getTransfers,
    getTransfer,
    getTransferDetails,
    getTransferStatusSummary,
    getTransfersSuccessRate,
    getTransfersAvgResponseTime,
} = require('./Transfer');
const { getErrors } = require('./Error');
const { getPositions } = require('./Position');
const { getFlows } = require('./Flow');
const {
    getFxpConversions ,
    getFxpConversion,
    getFxpConversionDetails,
    getFxpConversionStatusSummary,
    getFxpConversionsSuccessRate,
    getFxpConversionsAvgResponseTime,
} = require('./FxpConversion');

module.exports = {
    getBatches,
    getBatch,
    getTransfers,
    getTransfer,
    getTransferDetails,
    getTransfersSuccessRate,
    getTransfersAvgResponseTime,
    getTransferStatusSummary,
    getErrors,
    getPositions,
    getFlows,
    getFxpConversions ,
    getFxpConversion,
    getFxpConversionDetails,
    getFxpConversionStatusSummary,
    getFxpConversionsSuccessRate,
    getFxpConversionsAvgResponseTime,
};
