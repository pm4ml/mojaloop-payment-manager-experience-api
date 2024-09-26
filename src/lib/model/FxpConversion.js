/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Ujjwal Panwar - ujjwal.panwar@izyane.com                         *
 *                                                                        *
 **************************************************************************/

const util = require('util');
const mock = require('./mock');

class FxpConversion {
    /**
     *
     * @param props {object}
     * @param [props.mockData] {boolean}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this.logger = props.logger;
        this._db = props.db;
    }

    static STATUSES = {
        null: 'PENDING',
        1: 'SUCCESS',
        0: 'ERROR',
    };

    _joinFxQuotesAndFxTransfers(query){
        return query
            .leftJoin('fx_transfer', 'fx_quote.conversion_id','fx_transfer.commit_request_id')
            .select([
                'fx_quote.*',
                'fx_transfer.fulfilment as fulfilment',
                'fx_transfer.conversion_state as conversion_state',
                'fx_transfer.expiration as fx_transfer_expiration',
            ]);
    }

    static _fxpConversionLastErrorToErrorType(err){
        if(err.mojaloopError) {
            return err.mojaloopError.errorInformation.errorDescription;
        }
        return `HTTP ${err.httpStatusCode}`;
    }

    _parseRawTransferRequestBodies(transferRaw) {
        // operate on a copy of incoming object...we dont want side effects

        const raw = JSON.parse(JSON.stringify(transferRaw));

        if(
            raw.fxQuoteResponse &&
            typeof raw.fxQuoteResponse.body === 'string'
        ) {
            raw.fxQuoteResponse.body = JSON.parse(raw.fxQuoteResponse.body);
        }
        if(
            raw.fxQuoteRequest &&
            typeof raw.fxQuoteRequest.body === 'string'
        ) {
            raw.fxQuoteRequest.body = JSON.parse(raw.fxQuoteRequest.body);
        }
        if(
            raw.fxPrepare &&
            typeof raw.fxPrepare.body === 'string'
        ) {
            raw.fxPrepare.body = JSON.parse(raw.fxPrepare.body);
        }
        if (raw.fulfil && typeof raw.fulfil.body === 'string') {
            raw.fulfil.body = JSON.parse(raw.fulfil.body);
        }

        return raw;
    }

    _calculateTotalChargesFromCharges(charges){
        if(!charges)
            return {
                totalSourceCurrencyCharges: { amount: '', currency: ''},
                totalTargetCurrencyCharges: { amount: '', currency: ''},
            };

        let totalSourceCurrencyCharges = 0;
        let totalTargetCurrencyCharges = 0;

        charges.forEach( charge => {
            const sourceAmount = parseFloat(charge.sourceAmount.amount);
            const targetAmount = parseFloat(charge.targetAmount.amount);

            totalSourceCurrencyCharges += sourceAmount;
            totalTargetCurrencyCharges += targetAmount;
        });

        return {
            totalSourceCurrencyCharges: {
                amount: totalSourceCurrencyCharges.toString(),
                currency: charges[0].sourceAmount.currency,
            },
            totalTargetCurrencyCharges: {
                amount: totalTargetCurrencyCharges.toString(),
                currency: charges[0].targetAmount.currency
            },
        };
    }

    _calculateExchangeRate(sourceAmount, targetAmount, totalSourceCharges, totalTargetCharges) {
        return (targetAmount - totalTargetCharges)/(sourceAmount - totalSourceCharges);
    }

    _getConversionTermsFromFxQuoteResponse(fxQuoteResponse) {
        if(fxQuoteResponse == undefined){
            return {
                charges : {
                    totalSourceCurrencyCharges: { amount: '', currency: ''},
                    totalTargetCurrencyCharges: { amount: '', currency: ''},
                },
                expiryDate: '',
                transferAmount: {
                    sourceAmount : {
                        amount: '', currency: ''
                    },
                    targetAmount : {
                        amount: '',
                        currency: '',
                    },
                },
                exchangeRate: '',
            };
        }


        let conversionTerms = fxQuoteResponse.body.conversionTerms;
        if(fxQuoteResponse.body && typeof fxQuoteResponse.body.conversionTerms === 'string')
        conversionTerms = JSON.parse(fxQuoteResponse.body.conversionTerms);

        if(!conversionTerms)
            return ;

        const charges = this._calculateTotalChargesFromCharges(conversionTerms.charges);
        const transferAmount = {
            sourceAmount : {
                amount:
                conversionTerms.sourceAmount &&
                conversionTerms.sourceAmount.amount,
                currency:
                conversionTerms.sourceAmount &&
                conversionTerms.sourceAmount.currency,
            },
            targetAmount : {
                amount:
                conversionTerms.targetAmount &&
                conversionTerms.targetAmount.amount,
                currency:
                conversionTerms.targetAmount &&
                conversionTerms.targetAmount.currency,
            },
        };
        return {
            charges : charges ,
            expiryDate: conversionTerms.expiration,
            transferAmount: transferAmount,
            exchangeRate: this._calculateExchangeRate(
                transferAmount.sourceAmount.amount,
                transferAmount.targetAmount.amount,
                parseFloat(charges.totalSourceCurrencyCharges.amount),
                parseFloat(charges.totalTargetCurrencyCharges.amount),
            )
        };

    }

    _convertToApiFormat(fxpConversion) {
        const raw = JSON.parse(fxpConversion.raw);

        return {
            conversionId: fxpConversion.conversion_id,
            batchId: fxpConversion.batchId,
            institution: fxpConversion.counter_party_fsp,
            direction: fxpConversion.direction,
            amount: fxpConversion.source_amount,
            current: fxpConversion.source_currency,
            initiatedTimestamp: new Date(fxpConversion.created_at).toISOString(),
            status: FxpConversion.STATUSES[fxpConversion.success],
            errorType:
              fxpConversion.success === 0
                  ? FxpConversion._fxpConversionLastErrorToErrorType(raw.lastError)
                  : null,
        };
    }

    _convertToApiDetailFormat(fxpConversion){
        let raw = JSON.parse(fxpConversion.raw);
        raw = this._parseRawTransferRequestBodies(raw);
        return {
            conversionDetails: {
                determiningTransferId: fxpConversion.determining_transfer_id,
                conversionId: fxpConversion.conversionId,
                conversionRequestId: fxpConversion.conversion_request_id,
                conversionState: fxpConversion.conversion_state ? fxpConversion.conversion_state : raw.currentState,
                sourceAmount: {
                    amount: fxpConversion.source_amount,
                    currency: fxpConversion.source_currency,
                },
                targetAmount: {
                    amount: fxpConversion.target_amount,
                    currency: fxpConversion.source_currency
                },
                conversionAcceptedDate: new Date(fxpConversion.completed_at),
                conversionSettlementBatch: fxpConversion.batchId,
                conversionType: fxpConversion.direction === 'OUTBOUND' ? 'Payer DFSP conversion' : '',
                dfspInstitution: null,
            },
            conversionTerms: {
                determiningTransferId: fxpConversion.determining_transfer_id,
                conversionId: fxpConversion.conversion_id,
                conversionState: raw.currentState,
                quoteAmount: {
                    amount : null,
                    currency: null,
                },
                quoteAmountType: fxpConversion.amount_type,
                conversionTerms: this._getConversionTermsFromFxQuoteResponse(raw.fxQuoteResponse),
            },
            technicalDetails: {
                conversionRequestId: fxpConversion.conversion_request_id,
                conversionId: fxpConversion.conversion_id,
                determiningTransferId: fxpConversion.determining_transfer_id,
                conversionState: fxpConversion.conversion_state,
                fxQuoteRequest: raw.fxQuoteRequest,
                fxQuoteResponse: raw.fxQuoteResponse,
                fxTransferPrepare: fxpConversion.direction === 'OUTBOUND' ?
                {
                    headers: raw.fxTransferRequest && raw.fxTransferRequest.headers,
                    body: raw.fxTransferRequest && raw.fxTransferRequest.body && JSON.parse(raw.fxTransferRequest.body),
                }: raw.fxPrepare,
                fxTransferFulfil: fxpConversion.direction === 'OUTBOUND' ?
                    raw.fxTransferResponse && raw.fxTransferResponse.body : raw.fulfil,
                lastError: raw.lastError,
            }
        };
    }

    async findAll() {
        let query = this._db('fx_quote').whereRaw('true');

        query = this._joinFxQuotesAndFxTransfers(query);
        const rows = await query;

        return rows.map(this._convertToApiFormat.bind(this));
    }

    /**
     *
     * @param id {string}
     */
    async details(id) {
        if (this.mockData) {
            return mock.getTransferDetails({ id });
        }

        const query = this._db('fx_quote').where('fx_quote.conversion_id', id);
        this._joinFxQuotesAndFxTransfers(query);
        const rows = await query;
        if (rows.length > 0) {
            return this._convertToApiDetailFormat(rows[0]);
        }
        return null;
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.minutePrevious] {number}
     */
    async successRate(opts) {
        const now = Date.now();
        const statQuery = (successOnly) => {
            const query = this._db('fx_quote')
                .count('conversion_id as count')
                .select(this._db.raw('MIN(((created_at) / (60 * 1000)) * 60 * 1000) as timestamp')) // trunc (milli)seconds
                .whereRaw(`(${now} - created_at) < ${(opts.minutePrevious || 10) * 60 * 1000}`);
            if (successOnly) {
                query.andWhere('success', true);
            }
            query.groupByRaw('created_at / (60 * 1000)');
            return query;
        };

        const successStat = await statQuery(true);
        const allStat = await statQuery(false);
        return allStat.map(({ timestamp, count }) => {
            const successRow = successStat.find((row) => row.timestamp === timestamp);
            const successCount = successRow ? (successRow.count ) : 0;
            return {
                timestamp,
                percentage: Math.trunc((successCount / (count )) * 100),
            };
        });
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.minutePrevious] {number}
     */
    async avgResponseTime(opts) {
        if (this.mockData) {
            return mock.getTransfersAvgResponseTime(opts);
        }
        const now = Date.now();
        const avgRespTimeQuery = () => {
            return this._db('fx_quote')
                .select(this._db.raw('AVG(completed_at - created_at) as averageResponseTime')) // trunc (milli)seconds
                .select(this._db.raw('MIN(((created_at) / (60 * 1000)) * 60 * 1000) as timestamp')) // trunc (milli)seconds
                .whereRaw(`(${now} - created_at) < ${(opts.minutePrevious || 10) * 60 * 1000}`)
                .andWhereRaw('success IS NOT NULL')
                .andWhereRaw('completed_at IS NOT NULL')
                .andWhereRaw('created_at IS NOT NULL')
                .groupByRaw('created_at / (60 * 1000)');
        };

        const rows = await avgRespTimeQuery();
        return rows;
    }

    /**
     *
     * @param opts {Object}
     * @param [opts.startTimestamp] {string}
     * @param [opts.endTimestamp] {string}
     */
    async statusSummary(opts) {
        if (this.mockData) {
            return mock.getTransferStatusSummary(opts);
        }
        const statusQuery = () => {
            const query = this._db('fx_quote').select('success').count('conversion_id as count').whereRaw('true');
            if (opts.startTimestamp) {
                query.andWhere('created_at', '>=', new Date(opts.startTimestamp).getTime());
            }
            if (opts.endTimestamp) {
                query.andWhere('created_at', '<', new Date(opts.endTimestamp).getTime());
            }
            query.groupBy('success');
            return query;
        };
        const rows = await statusQuery();

        let ret = {};

        Object.keys(FxpConversion.STATUSES).map((k) => {
            ret[FxpConversion.STATUSES[k]] = {
                status: FxpConversion.STATUSES[k],
                count: 0,
            };
        });

        rows.forEach((r) => {
            ret[FxpConversion.STATUSES[r.success]] = {
                status: FxpConversion.STATUSES[r.success],
                count: r.count,
            };
        });

        return Object.keys(ret).map((r) => ret[r]);
    }

    async fxpErrors(opts){
        // TODO: Implement fxpErrors
        try {
            let query = this._db('fx_quote').where('success', false);
            query = this._joinFxQuotesAndFxTransfers(query);

            const rows = await query;
            return rows.map(this._convertToApiFormat.bind(this));
        } catch (err) {
            this.logger.log(
                `Error getting transfer errors: ${err.stack || util.inspect(err)}`
            );
            throw err;
        }
    }



}

module.exports = FxpConversion;

