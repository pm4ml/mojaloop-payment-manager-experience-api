const Transfer = require('../../../src/lib/model/Transfer');
const mock = require('../../../src/lib/model/mock');
// const util = require('../../../src/lib/utils/utils');

const mockDb = {
    _error: null, // To simulate database errors
    _result: null,
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(function () {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockImplementation(function () {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockImplementation(function () {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    groupBy: jest.fn().mockImplementation(function () {
        if (this._error) {
            return Promise.reject(this._error);
        }
        return Promise.resolve(this._result);
    }),
    raw: jest.fn().mockImplementation((query) => {
        if (query.includes('MIN')) {
            return Promise.resolve([{ timestamp: 1000 }]);
        }
        return Promise.resolve(query);
    }),

    setError: function (error) {
        this._error = error;
        return this;
    },

    setResult: function (result) {
        this._result = result;
        return this;
    },

    clear: function () {
        this._error = null;
        this._result = null;
    },
};

describe('Transfer', () => {
    let transfer;

    beforeAll(() => {
        transfer = new Transfer({ mockData: true, logger: console, db: mockDb });
    });

    test('should initialize with provided props', () => {
        expect(transfer.mockData).toBe(true);
        expect(transfer._db).toBe(mockDb);
    });

    test('should have correct static STATUSES', () => {
        expect(Transfer.STATUSES).toEqual({
            null: 'PENDING',
            1: 'SUCCESS',
            0: 'ERROR',
        });
    });

    test('should log error message when database query fails', async () => {
        transfer.mockData = false;
        mockDb._result = new Error('Database error');

        const loggerSpy = jest.spyOn(transfer.logger, 'log');

        try {
            await transfer.errors({
                startTimestamp: '2022-01-01',
                endTimestamp: '2022-12-31',
            });
        } catch (error) {
            expect(loggerSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error getting transfer errors')
            );
        }
    });
    test('should handle empty values in data transformations', () => {
        expect(
            transfer._convertToApiFormat({
                success: null,
                raw: '{}',
                created_at: '2023-01-01T00:00:00Z',
            })
        ).toHaveProperty('status', 'PENDING');
        expect(
            transfer._convertToApiFormat({
                success: 1,
                raw: '{}',
                created_at: '2023-01-01T00:00:00Z',
            })
        ).toHaveProperty('status', 'SUCCESS');
        expect(
            transfer._convertToApiFormat({
                success: 0,
                raw: '{"lastError":{}}',
                created_at: '2023-01-01T00:00:00Z',
            })
        ).toHaveProperty('status', 'ERROR');
    });

    test('should handle custom complex name formats', () => {
        const complexNameCases = [
            {
                input: { firstName: 'John', middleName: 'M', lastName: 'Doe' },
                expected: 'John M Doe',
            },
            {
                input: { firstName: 'John', lastName: 'Doe' },
                expected: 'John Doe',
            },
            {
                input: { firstName: 'John' },
                expected: 'John',
            },
            {
                input: null,
                expected: undefined,
            },
        ];

        complexNameCases.forEach(({ input, expected }) => {
            expect(transfer._complexNameToDisplayName(input)).toBe(expected);
        });
    });

    test('should handle edge cases in transfer party conversion', () => {
        const partyData = {
            idType: 'MSISDN',
            idValue: '123456789',
            idSubType: 'PERSONAL',
            firstName: 'John',
            middleName: 'M',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            merchantClassificationCode: '123',
            fspId: 'testFsp',
            extensionList: ['ext1', 'ext2'],
        };

        const result = transfer._convertToTransferParty(partyData);

        expect(result).toEqual({
            type: '',
            ...partyData,
            displayName: 'John M Doe',
        });
    });

    test('should handle edge cases in exchange rate calculation', () => {
        const testCases = [
            {
                input: {
                    sourceAmount: '100',
                    targetAmount: '200',
                    sourceCharges: 10,
                    targetCharges: 20,
                },
                expected: '2.0000',
            },
            {
                input: {
                    sourceAmount: '0',
                    targetAmount: '200',
                    sourceCharges: 10,
                    targetCharges: 20,
                },
                expected: '-18.0000',
            },
            {
                input: {
                    sourceAmount: '100',
                    targetAmount: '0',
                    sourceCharges: 10,
                    targetCharges: 20,
                },
                expected: '-0.2222',
            },
        ];

        testCases.forEach(({ input, expected }) => {
            const { sourceAmount, targetAmount, sourceCharges, targetCharges } =
        input;
            expect(
                transfer._calculateExchangeRate(
                    sourceAmount,
                    targetAmount,
                    sourceCharges,
                    targetCharges
                )
            ).toBe(expected);
        });
    });

    test('should parse various raw transfer request bodies', () => {
        const rawTransfer = {
            getPartiesRequest: {
                body: JSON.stringify({ party: 'test' }),
            },
            quoteRequest: {
                body: JSON.stringify({ quote: 'test' }),
            },
        };

        const result = transfer._parseRawTransferRequestBodies(rawTransfer);

        expect(result.getPartiesRequest.body).toEqual({ party: 'test' });
        expect(result.quoteRequest.body).toEqual({ quote: 'test' });

        // Test invalid JSON separately to ensure it throws
        expect(() => {
            transfer._parseRawTransferRequestBodies({
                getPartiesRequest: { body: 'invalid json' },
            });
        }).toThrow();
    });

    test('should calculate hourly flows correctly', async () => {
        transfer = new Transfer({
            mockData: true,
            logger: { log: jest.fn() },
            db: mockDb,
        });

        const mockFlowData = [
            {
                timestamp: 1000,
                currency: 'USD',
                inbound: 300,
                outbound: 500,
            },
        ];

        mock.getFlows = jest.fn().mockResolvedValueOnce(mockFlowData);

        const result = await transfer.hourlyFlow({ hoursPrevious: 24 });

        expect(result).toEqual(mockFlowData);
    });

    test('should apply join correctly', () => {
        const query = mockDb;
        transfer._applyJoin(query);
        expect(query.leftJoin).toHaveBeenCalledWith(
            'fx_quote',
            'transfer.redis_key',
            'fx_quote.redis_key'
        );
        expect(query.leftJoin).toHaveBeenCalledWith(
            'fx_transfer',
            'fx_quote.redis_key',
            'fx_transfer.redis_key'
        );
        expect(query.select).toHaveBeenCalledWith([
            'transfer.*',
            'fx_quote.source_currency as fx_source_currency',
            'fx_quote.source_amount as fx_source_amount',
            'fx_quote.target_currency as fx_target_currency',
            'fx_quote.target_amount as fx_target_amount',
            'fx_transfer.source_currency as fx_transfer_source_currency',
            'fx_transfer.target_currency as fx_transfer_target_currency',
            'fx_transfer.commit_request_id as fx_commit_request_id',
        ]);
    });

    test('should convert transfer to API format correctly', () => {
        const transferData = {
            id: '1',
            batch_id: 'batch1',
            dfsp: 'dfsp1',
            direction: 1,
            currency: 'USD',
            amount: '100',
            success: 1,
            created_at: '2020-01-01T00:00:00Z',
            sender: 'sender1',
            sender_id_type: 'type1',
            sender_id_sub_value: 'sub1',
            sender_id_value: 'value1',
            recipient: 'recipient1',
            recipient_id_type: 'type2',
            recipient_id_sub_value: 'sub2',
            recipient_id_value: 'value2',
            raw: JSON.stringify({
                homeTransactionId: 'home1',
                lastError: { httpStatusCode: 500 },
                getPartiesRequest: { body: {} },
                quoteRequest: { body: {} },
                quoteResponse: { body: {} },
            }),
            details: 'details1',
        };
        const result = transfer._convertToApiFormat(transferData);
        expect(result).toEqual({
            id: '1',
            batchId: 'batch1',
            institution: 'dfsp1',
            direction: 'OUTBOUND',
            currency: 'USD',
            amount: 100,
            type: 'P2P',
            status: 'SUCCESS',
            initiatedTimestamp: '2020-01-01T00:00:00.000Z',
            confirmationNumber: 0,
            sender: 'sender1',
            senderIdType: 'type1',
            senderIdSubValue: 'sub1',
            senderIdValue: 'value1',
            recipient: 'recipient1',
            recipientIdType: 'type2',
            recipientIdSubValue: 'sub2',
            recipientIdValue: 'value2',
            homeTransferId: 'home1',
            details: 'details1',
            errorType: null,
        });
    });

    test('should convert last error to error type correctly', () => {
        const error = {
            mojaloopError: { errorInformation: { errorDescription: 'error' } },
        };
        const result = Transfer._transferLastErrorToErrorType(error);
        expect(result).toBe('error');

        const error2 = { httpStatusCode: 500 };
        const result2 = Transfer._transferLastErrorToErrorType(error2);
        expect(result2).toBe('HTTP 500');
    });

    test('should parse raw transfer request bodies correctly', () => {
        const transferRaw = {
            getPartiesRequest: { body: '{"key":"value"}' },
            quoteRequest: { body: '{"key":"value"}' },
            quoteResponse: { body: '{"key":"value"}' },
            fxQuoteResponse: { body: '{"key":"value"}' },
            fxQuoteRequest: { body: '{"key":"value"}' },
            fxTransferRequest: { body: '{"key":"value"}' },
            fxTransferResponse: { body: '{"key":"value"}' },
            prepare: { body: '{"key":"value"}' },
            fulfil: { body: '{"key":"value"}' },
        };
        const result = transfer._parseRawTransferRequestBodies(transferRaw);
        expect(result).toEqual({
            getPartiesRequest: { body: { key: 'value' } },
            quoteRequest: { body: { key: 'value' } },
            quoteResponse: { body: { key: 'value' } },
            fxQuoteResponse: { body: { key: 'value' } },
            fxQuoteRequest: { body: { key: 'value' } },
            fxTransferRequest: { body: { key: 'value' } },
            fxTransferResponse: { body: { key: 'value' } },
            prepare: { body: { key: 'value' } },
            fulfil: { body: { key: 'value' } },
        });
    });

    test('should get conversion terms from fx quote response correctly', () => {
        const fxQuoteResponse = {
            body: {
                conversionTerms:
          '{"sourceAmount":{"amount":"100","currency":"USD"},"targetAmount":{"amount":"200","currency":"EUR"},"charges":[],"expiration":"2020-01-01T00:00:00Z"}',
            },
        };
        const result =
      transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result).toEqual({
            charges: {
                totalSourceCurrencyCharges: { amount: '0', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '0', currency: 'EUR' },
            },
            expiryDate: '2020-01-01T00:00:00Z',
            transferAmount: {
                sourceAmount: { amount: '100', currency: 'USD' },
                targetAmount: { amount: '200', currency: 'EUR' },
            },
            exchangeRate: '2.0000',
        });
    });

    describe('Data Transformation and Formatting', () => {
        test('should apply joins correctly', () => {
            const query = mockDb;
            transfer._applyJoin(query);

            expect(query.leftJoin).toHaveBeenCalledWith(
                'fx_quote',
                'transfer.redis_key',
                'fx_quote.redis_key'
            );
            expect(query.leftJoin).toHaveBeenCalledWith(
                'fx_transfer',
                'fx_quote.redis_key',
                'fx_transfer.redis_key'
            );
            expect(query.select).toHaveBeenCalledWith(
                expect.arrayContaining([
                    'transfer.*',
                    'fx_quote.source_currency as fx_source_currency',
                    'fx_transfer.commit_request_id as fx_commit_request_id',
                ])
            );
        });

        test('should format transfer object correctly for API response', () => {
            const transferData = {
                id: '1',
                batch_id: 'batch1',
                dfsp: 'dfsp1',
                direction: 1,
                currency: 'USD',
                amount: '100',
                success: 1,
                created_at: '2023-01-01T00:00:00Z',
                sender: 'sender1',
                sender_id_type: 'type1',
                raw: JSON.stringify({ homeTransactionId: 'home1' }),
            };

            const result = transfer._convertToApiFormat(transferData);

            expect(result).toEqual(
                expect.objectContaining({
                    id: '1',
                    batchId: 'batch1',
                    institution: 'dfsp1',
                    currency: 'USD',
                    amount: 100,
                    status: 'SUCCESS',
                    homeTransferId: 'home1',
                })
            );
        });

        test('should parse raw transfer request bodies correctly', () => {
            const rawTransfer = {
                getPartiesRequest: { body: JSON.stringify({ key: 'value' }) },
                quoteRequest: { body: JSON.stringify({ quote: 'test' }) },
            };

            const result = transfer._parseRawTransferRequestBodies(rawTransfer);

            expect(result.getPartiesRequest.body).toEqual({ key: 'value' });
            expect(result.quoteRequest.body).toEqual({ quote: 'test' });
        });

        test('should throw an error for invalid JSON in raw transfer request bodies', () => {
            const rawTransfer = {
                getPartiesRequest: { body: 'invalid json' },
            };

            expect(() =>
                transfer._parseRawTransferRequestBodies(rawTransfer)
            ).toThrow();
        });

        test('should extract and format conversion terms from FX quote response', () => {
            const fxQuoteResponse = {
                body: {
                    conversionTerms: JSON.stringify({
                        sourceAmount: { amount: '100', currency: 'USD' },
                        targetAmount: { amount: '200', currency: 'EUR' },
                        charges: [],
                        expiration: '2023-12-31T23:59:59Z',
                    }),
                },
            };

            const result =
        transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);

            expect(result).toEqual(
                expect.objectContaining({
                    transferAmount: {
                        sourceAmount: { amount: '100', currency: 'USD' },
                        targetAmount: { amount: '200', currency: 'EUR' },
                    },
                    expiryDate: '2023-12-31T23:59:59Z',
                })
            );
        });

        test('should handle missing or undefined FX quote response in getConversionTerms', () => {
            expect(
                transfer._getConversionTermsFromFxQuoteResponse(undefined)
            ).toEqual({
                transferAmount: {
                    sourceAmount: { amount: '', currency: '' },
                    targetAmount: { amount: '', currency: '' },
                },
                exchangeRate: '',
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' },
                },
                expiryDate: '',
            });

            expect(
                transfer._getConversionTermsFromFxQuoteResponse({ body: {} })
            ).toBeUndefined();
        });

        test('should return mock data when mockData is true', async () => {
            const mockId = '123';
            const mockDataResponse = { id: mockId };

            mock.getTransferDetails = jest.fn().mockReturnValueOnce(mockDataResponse);

            const result = await transfer.details(mockId);

            expect(mock.getTransferDetails).toHaveBeenCalledWith({ id: mockId });
            expect(result).toEqual(mockDataResponse);
        });

        test('should return null transfer details if no data found in database when mockdata is false', async () => {
            transfer._db = jest.fn().mockImplementation(() => mockDb);

            transfer.mockData = false;
            const mockApplyJoin = jest.fn();
            mockDb.where.mockReturnValueOnce(mockDb);

            mockApplyJoin.mockResolvedValueOnce([]);

            const result = await transfer.details('789');

            expect(result).toBeNull();
        });

        test('should return converted API detail format for transfer details if data is found in the database when mockData is false', async () => {
            transfer.mockData = false;

            const mockTransferId = '12345';
            const mockQueryResult = [
                {
                    id: mockTransferId,
                    amount: '100.00',
                    currency: 'USD',
                    success: true,
                    createdAt: '2024-12-23T19:35:38.865Z',
                },
            ];

            const mockDb = {
                where: jest.fn().mockReturnThis(),
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                then: jest.fn((cb) => cb(mockQueryResult)),
            };

            transfer._db = jest.fn(() => mockDb);
            transfer._applyJoin = jest.fn().mockReturnValue(mockDb);

            const mockApiDetails = {
                transferDetails: {
                    id: mockTransferId,
                    amount: {
                        value: '100.00',
                        currency: 'USD',
                    },
                    status: 'SUCCESS',
                },
            };

            transfer._convertToApiDetailFormat = jest
                .fn()
                .mockReturnValue(mockApiDetails);

            const result = await transfer.details(mockTransferId);

            expect(result).toEqual(mockApiDetails);
            expect(transfer._applyJoin).toHaveBeenCalledTimes(1);
            expect(mockDb.where).toHaveBeenCalledWith('transfer.id', mockTransferId);
            expect(transfer._convertToApiDetailFormat).toHaveBeenCalledWith(
                mockQueryResult[0]
            );
        });
    });

    describe('Calculations', () => {
        test('should calculate exchange rate correctly', () => {
            const result = transfer._calculateExchangeRate(100, 200, 10, 20);
            expect(result).toBe('2.0000');
        });

        test('should calculate total charges correctly', () => {
            const charges = [
                {
                    sourceAmount: { amount: '10', currency: 'USD' },
                    targetAmount: { amount: '20', currency: 'EUR' },
                },
                {
                    sourceAmount: { amount: '5', currency: 'USD' },
                    targetAmount: { amount: '10', currency: 'EUR' },
                },
            ];
            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'USD',
                'EUR'
            );
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '15', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '30', currency: 'EUR' },
            });
        });

        test('should handle non-matching and invalid currencies, and null values in charge calculations', () => {
            const charges = [
                {
                    sourceAmount: { amount: '10', currency: 'GBP' },
                    targetAmount: { amount: '20', currency: 'JPY' },
                },
                {
                    sourceAmount: { amount: '5', currency: 'USD' },
                    targetAmount: { amount: '10', currency: 'EUR' },
                },
                {
                    sourceAmount: undefined,
                    targetAmount: { amount: '20', currency: 'EUR' },
                },
                {
                    sourceAmount: { amount: '5', currency: 'USD' },
                    targetAmount: undefined,
                },
                {
                    sourceAmount: { amount: '10', currency: 'INVALID' },
                    targetAmount: { amount: '5', currency: 'XXX' },
                },
            ];
            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'USD',
                'EUR'
            );
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '10', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '30', currency: 'EUR' },
            });
        });

        test.each([
            {
                sourceAmount: '100',
                targetAmount: '200',
                sourceCharges: 10,
                targetCharges: 20,
                expected: '2.0000',
            },
            {
                sourceAmount: '0',
                targetAmount: '200',
                sourceCharges: 10,
                targetCharges: 20,
                expected: '-18.0000',
            },
            {
                sourceAmount: '100',
                targetAmount: '0',
                sourceCharges: 10,
                targetCharges: 20,
                expected: '-0.2222',
            },
            {
                sourceAmount: '0',
                targetAmount: '200',
                sourceCharges: 0,
                targetCharges: 20,
                expected: null,
            },
            {
                sourceAmount: '999999999999999999999',
                targetAmount: '1000',
                sourceCharges: '0',
                targetCharges: '0',
                expected: expect.anything(),
            },
        ])(
            'should calculate exchange rate correctly for various scenarios including normal, edge, and extreme cases',
            ({
                sourceAmount,
                targetAmount,
                sourceCharges,
                targetCharges,
                expected,
            }) => {
                const result = transfer._calculateExchangeRate(
                    sourceAmount,
                    targetAmount,
                    sourceCharges,
                    targetCharges
                );
                expect(result).toEqual(expected);
            }
        );
    });

    describe('Party Information Handling', () => {
        test('should extract payer party information from quote request', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: {
                            partyIdType: 'MSISDN',
                            partyIdentifier: '123456789',
                        },
                    },
                },
            };

            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');

            expect(result).toEqual(
                expect.objectContaining({
                    idType: 'MSISDN',
                    idValue: '123456789',
                })
            );
        });

        test('should handle missing or undefined party in quote request', () => {
            expect(
                transfer._getPartyFromQuoteRequest({ body: {} }, 'payer')
            ).toBeUndefined();
            expect(
                transfer._getPartyFromQuoteRequest({ body: { payer: {} } }, 'payer')
            ).toEqual({
                idType: undefined,
                idValue: undefined,
                idSubType: undefined,
                displayName: undefined,
                firstName: undefined,
                middleName: undefined,
                lastName: undefined,
                dateOfBirth: undefined,
                merchantClassificationCode: undefined,
                fspId: undefined,
                extensionList: undefined,
            });
        });

        test('should get party from quote request correctly', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: {
                            partyIdType: 'type1',
                            partyIdentifier: 'value1',
                            partySubIdOrType: 'sub1',
                            fspId: 'fsp1',
                            extensionList: { extension: ['ext'] },
                        },
                        name: 'payer1',
                        personalInfo: {
                            complexName: {
                                firstName: 'first',
                                middleName: 'middle',
                                lastName: 'last',
                            },
                            dateOfBirth: '2000-01-01',
                        },
                        merchantClassificationCode: 'code1',
                    },
                },
            };
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            expect(result).toEqual({
                idType: 'type1',
                idValue: 'value1',
                idSubType: 'sub1',
                displayName: 'payer1',
                firstName: 'first',
                middleName: 'middle',
                lastName: 'last',
                dateOfBirth: '2000-01-01',
                merchantClassificationCode: 'code1',
                fspId: 'fsp1',
                extensionList: ['ext'],
            });
        });

        test('should convert complex name to display name correctly', () => {
            const complexName = {
                firstName: 'first',
                middleName: 'middle',
                lastName: 'last',
            };
            const result = transfer._complexNameToDisplayName(complexName);
            expect(result).toBe('first middle last');
        });

        test('should convert party to transfer party correctly', () => {
            const party = {
                idType: 'type1',
                idValue: 'value1',
                idSubType: 'sub1',
                displayName: 'display',
                firstName: 'first',
                middleName: 'middle',
                lastName: 'last',
                dateOfBirth: '2000-01-01',
                merchantClassificationCode: 'code1',
                fspId: 'fsp1',
                extensionList: [],
            };
            const result = transfer._convertToTransferParty(party);
            expect(result).toEqual({
                type: '',
                idType: 'type1',
                idValue: 'value1',
                idSubType: 'sub1',
                displayName: 'display',
                firstName: 'first',
                middleName: 'middle',
                lastName: 'last',
                dateOfBirth: '2000-01-01',
                merchantClassificationCode: 'code1',
                fspId: 'fsp1',
                extensionList: [],
            });
        });

        test('should handle undefined fxQuoteResponse in getConversionTerms', () => {
            const result = transfer._getConversionTermsFromFxQuoteResponse(undefined);
            expect(result).toEqual({
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' },
                },
                expiryDate: '',
                transferAmount: {
                    sourceAmount: { amount: '', currency: '' },
                    targetAmount: { amount: '', currency: '' },
                },
                exchangeRate: '',
            });
        });
    });

    describe('Complex Name Handling', () => {
        test.each([
            {
                name: { firstName: 'John', middleName: 'M', lastName: 'Doe' },
                expected: 'John M Doe',
            },
            { name: { firstName: 'John', lastName: 'Doe' }, expected: 'John Doe' },
            { name: { firstName: 'John' }, expected: 'John' },
            { name: null, expected: undefined },
        ])('should format complex names to display names', ({ name, expected }) => {
            expect(transfer._complexNameToDisplayName(name)).toBe(expected);
        });

        test('should handle partial complex name', () => {
            const result = transfer._complexNameToDisplayName({
                firstName: 'John',
                lastName: 'Doe',
            });
            expect(result).toBe('John Doe');
        });

        test('should correctly format complex name to display name', () => {
            const transfer = new Transfer({ mockData: false, logger: console });

            expect(
                transfer._complexNameToDisplayName({
                    firstName: 'John',
                    middleName: 'M',
                    lastName: 'Doe',
                })
            ).toBe('John M Doe');

            expect(
                transfer._complexNameToDisplayName({
                    firstName: 'John',
                    lastName: 'Doe',
                })
            ).toBe('John Doe');

            expect(
                transfer._complexNameToDisplayName({
                    firstName: 'John',
                })
            ).toBe('John');

            expect(transfer._complexNameToDisplayName(null)).toBeUndefined();
        });
    });

    describe('Error Handling', () => {
        test.each([
            {
                error: {
                    mojaloopError: {
                        errorInformation: { errorDescription: 'Test error' },
                    },
                },
                expected: 'Test error',
            },
            { error: { httpStatusCode: 500 }, expected: 'HTTP 500' },
        ])(
            'should determine error type from transfer last error',
            ({ error, expected }) => {
                expect(Transfer._transferLastErrorToErrorType(error)).toBe(expected);
            }
        );

        test('should handle null error object in last error gracefully', () => {
            const result = transfer._convertToApiFormat({
                raw: JSON.stringify({ lastError: null }),
                created_at: new Date().toISOString(),
            });
            expect(result.errorType).toBeNull();
        });
    });

    describe('findAll and findAllWithFX Methods', () => {
        beforeEach(() => {
            transfer.mockData = true;
            jest.spyOn(mock, 'getTransfers').mockResolvedValue([]);
        });

        const testParams = [
            {},
            { id: 'test-id' },
            { startTimestamp: '2022-01-01' },
            { endTimestamp: '2022-12-31' },
            { senderIdType: 'type1' },
            { senderIdValue: 'value1' },
            { senderIdSubValue: 'sub1' },
            { recipientIdType: 'type2' },
            { recipientIdValue: 'value2' },
            { recipientIdSubValue: 'sub2' },
            { direction: 'INBOUND' },
            { institution: 'institution1' },
            { batchId: 'batch1' },
            { status: 'PENDING' },
            { offset: 0 },
            { limit: 10 },
            {
                id: 'test-id',
                startTimestamp: '2022-01-01',
                endTimestamp: '2022-12-31',
                senderIdType: 'type1',
                senderIdValue: 'value1',
                senderIdSubValue: 'sub1',
                recipientIdType: 'type2',
                recipientIdValue: 'value2',
                recipientIdSubValue: 'sub2',
                direction: 'INBOUND',
                institution: 'institution1',
                batchId: 'batch1',
                status: 'PENDING',
                offset: 0,
                limit: 10,
            },
        ];

        test.each(testParams)(
            'findAll should handle various query parameters',
            async (params) => {
                const mockResponse = [{ id: 'test-id', raw: '{}' }];
                mock.getTransfers.mockResolvedValue(mockResponse);

                const result = await transfer.findAll(params);

                expect(result).toHaveLength(mockResponse.length);
                if (mockResponse.length > 0) {
                    expect(result[0].id).toBe('test-id');
                }
                expect(mock.getTransfers).toHaveBeenCalledWith(
                    expect.objectContaining(params)
                );
            }
        );

        test.each(testParams)(
            'findAllWithFX should handle various query parameters',
            async (params) => {
                const mockResponse = [{ id: 'test-id', raw: '{}' }];
                mock.getTransfers.mockResolvedValue(mockResponse);

                const result = await transfer.findAllWithFX(params);

                expect(result).toHaveLength(mockResponse.length);
                if (mockResponse.length > 0) {
                    expect(result[0].id).toBe('test-id');
                }
                expect(mock.getTransfers).toHaveBeenCalledWith(
                    expect.objectContaining(params)
                );
            }
        );

        test('should handle empty response for findAll and findAllWithFX', async () => {
            mock.getTransfers.mockResolvedValue([]);

            const resultFindAll = await transfer.findAll({});
            const resultFindAllWithFX = await transfer.findAllWithFX({});

            expect(resultFindAll).toHaveLength(0);
            expect(resultFindAllWithFX).toHaveLength(0);
        });

        test('should handle findAllWithFX with mock data', async () => {
            const mockTransfers = [
                { id: 'fx1', fx_source_currency: 'USD', fx_target_currency: 'EUR' },
            ];
            mock.getTransfers = jest.fn().mockResolvedValue(mockTransfers);

            const result = await transfer.findAllWithFX({ limit: 10 });
            expect(result).toEqual(mockTransfers);
        });

        test('should handle undefined party in getPartyFromQuoteRequest', () => {
            const quoteRequest = { body: {} };
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            expect(result).toBeUndefined();
        });

        test('should handle missing conversionTerms in fxQuoteResponse', () => {
            const fxQuoteResponse = { body: {} };
            const result =
        transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
            expect(result).toBeUndefined();
        });

        test('should handle empty raw data in convertToApiDetailFormat', () => {
            const transferData = {
                id: '12345',
                amount: '100.00',
                currency: 'USD',
                success: true,
                raw: JSON.stringify({}),
                supported_currencies: '[]',
                created_at: new Date().toISOString(),
            };
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result).toEqual({
                transferDetails: {
                    id: '12345',
                    amount: {
                        value: '100.00',
                        currency: 'USD',
                    },
                    status: 'SUCCESS',
                },
            });
        });

        test('should parse raw transfer request bodies with invalid JSON', () => {
            const transferRaw = {
                getPartiesRequest: { body: 'invalid json' },
                quoteRequest: { body: 'invalid json' },
            };
            expect(() =>
                transfer._parseRawTransferRequestBodies(transferRaw)
            ).toThrow();
        });

        test('should handle division by zero in exchange rate calculation', () => {
            const result = transfer._calculateExchangeRate('0', '200', '0', '20');
            expect(result).toBe(null);
        });

        test('should handle undefined values in charges calculation', () => {
            const charges = [
                {
                    sourceAmount: undefined,
                    targetAmount: { amount: '20', currency: 'EUR' },
                },
                {
                    sourceAmount: { amount: '5', currency: 'USD' },
                    targetAmount: undefined,
                },
            ];
            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'USD',
                'EUR'
            );
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '5', currency: 'USD' },
                totalTargetCurrencyCharges: { amount: '20', currency: 'EUR' },
            });
        });

        test('should validate required fields in conversion terms', () => {
            const fxQuoteResponse = {
                body: {
                    conversionTerms: JSON.stringify({
                        sourceAmount: { amount: '100', currency: 'USD' },
                        targetAmount: { amount: '200', currency: 'EUR' },
                        charges: [],
                        expiration: '2020-01-01T00:00:00Z',
                    }),
                },
            };
            const result =
        transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
            expect(result).toEqual({
                charges: {
                    totalSourceCurrencyCharges: { amount: '0', currency: 'USD' },
                    totalTargetCurrencyCharges: { amount: '0', currency: 'EUR' },
                },
                expiryDate: '2020-01-01T00:00:00Z',
                transferAmount: {
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                },
                exchangeRate: '2.0000',
            });
        });

        test('should handle null charges in _calculateTotalChargesFromCharges', () => {
            const result = transfer._calculateTotalChargesFromCharges(
                null,
                'USD',
                'EUR'
            );
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' },
            });
        });
    });

    describe('transfer findOne method', () => {
        let transfer;

        beforeEach(() => {
            transfer = new Transfer({
                mockData: true,
                logger: { log: jest.fn() },
                db: mockDb,
            });
        });

        test('should return mock data when mockData is true', async () => {
            const mockTransfer = {
                id: '1',
                batchId: 269505,
                currency: 'USD',
                direction: 'INBOUND',
                initiatedTimestamp: '2024-12-23T19:35:38.865Z',
                institution: 'LY1WN5',
                status: 'ERROR',
                type: 'P2P',
                value: '1161.37',
            };

            mock.getTransfer = jest.fn().mockReturnValue(mockTransfer);
            transfer._db = jest.fn().mockImplementation(() => mockDb);

            const result = await transfer.findOne('1');

            expect(result).toEqual(mockTransfer);
        });

        test('should return database data when mockData is false', async () => {
            transfer.mockData = false;

            const dbTransfer = { id: '1', amount: '100', currency: 'USD' };
            mockDb.setResult(dbTransfer);
            transfer._convertToApiFormat = jest.fn().mockReturnValue({
                transferId: '1',
                amount: '100',
                currency: 'USD',
            });

            transfer._db = jest.fn().mockImplementation(() => mockDb);

            const result = await transfer.findOne('1');

            expect(result).toEqual({
                transferId: '1',
                amount: '100',
                currency: 'USD',
            });
            expect(mockDb.first).toHaveBeenCalledWith();
            expect(transfer._convertToApiFormat).toHaveBeenCalledWith(dbTransfer);
        });
    });

    describe('details Method', () => {
        test('should return transfer details by id', async () => {
            const id = 'test-id';
            const mockResponse = [{ id, raw: '{}' }];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);

            const result = await transfer.details(id);
            expect(result[0]).toEqual(expect.objectContaining({ id }));
        });

        test('should return null or empty array for non-existent id', async () => {
            const id = 'non-existent-id';
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(null);

            const result = await transfer.details(id);
            expect(result).toBeNull();
        });

        test('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);

            const result = await transfer.details('test-id');
            expect(result).toEqual([]);
        });
    });

    describe('Metrics Methods', () => {
        beforeEach(() => {
            transfer.mockData = true;
        });

        test('should return success rate for transfers', async () => {
            const mockSuccessResponse = [{ timestamp: 1234567890, percentage: 50 }];
            jest
                .spyOn(mock, 'getTransfersSuccessRate')
                .mockResolvedValue(mockSuccessResponse);

            const result = await transfer.successRate({ minutePrevious: 10 });
            expect(result).toEqual(mockSuccessResponse);
        });

        test('should return average response time for transfers', async () => {
            const mockResponse = [
                { timestamp: 1234567890, averageResponseTime: 1000 },
            ];
            jest
                .spyOn(mock, 'getTransfersAvgResponseTime')
                .mockResolvedValue(mockResponse);

            const result = await transfer.avgResponseTime({ minutePrevious: 10 });
            expect(result).toEqual(mockResponse);
        });

        test('should return status summary for transfers', async () => {
            const mockResponse = [
                { status: 'PENDING', count: 5 },
                { status: 'SUCCESS', count: 10 },
                { status: 'ERROR', count: 3 },
            ];
            jest
                .spyOn(mock, 'getTransferStatusSummary')
                .mockResolvedValue(mockResponse);

            const result = await transfer.statusSummary({});
            expect(result).toEqual(mockResponse);
        });

        test('should return hourly flow for transfers', async () => {
            const mockResponse = [
                { timestamp: 1234567890, currency: 'USD', outbound: 1000 },
            ];
            jest.spyOn(mock, 'getFlows').mockResolvedValue(mockResponse);

            const result = await transfer.hourlyFlow({ hoursPrevious: 10 });
            expect(result).toEqual(mockResponse);
        });

        test('should handle empty response for metrics methods', async () => {
            jest.spyOn(mock, 'getTransfersSuccessRate').mockResolvedValue([]);
            jest.spyOn(mock, 'getTransfersAvgResponseTime').mockResolvedValue([]);
            jest.spyOn(mock, 'getTransferStatusSummary').mockResolvedValue([]);
            jest.spyOn(mock, 'getFlows').mockResolvedValue([]);

            expect(await transfer.successRate({ minutePrevious: 10 })).toEqual([]);
            expect(await transfer.avgResponseTime({ minutePrevious: 10 })).toEqual(
                []
            );
            expect(await transfer.statusSummary({})).toEqual([]);
            expect(await transfer.hourlyFlow({ hoursPrevious: 10 })).toEqual([]);
        });
    });

    describe('Transfer Model Edge Cases and Additional Scenarios', () => {
        let transfer;

        beforeEach(() => {
            transfer = new Transfer({
                mockData: false,
                logger: { log: jest.fn() },
                db: mockDb,
            });
            jest.clearAllMocks();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should initialize with provided props', () => {
            expect(transfer.mockData).toBe(false);
            expect(transfer._db).toBe(mockDb);
        });

        test('should have correct static STATUSES', () => {
            expect(Transfer.STATUSES).toEqual({
                null: 'PENDING',
                1: 'SUCCESS',
                0: 'ERROR',
            });
        });

        test('should log error message when database query fails', async () => {
            transfer.mockData = false;
            mockDb._result = new Error('Database error');

            const loggerSpy = jest.spyOn(transfer.logger, 'log');

            try {
                await transfer.errors({
                    startTimestamp: '2022-01-01',
                    endTimestamp: '2022-12-31',
                });
            } catch (error) {
                expect(loggerSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Error getting transfer errors')
                );
            }
        });

        test('should handle empty values in data transformations', () => {
            expect(
                transfer._convertToApiFormat({
                    success: null,
                    raw: '{}',
                    created_at: '2023-01-01T00:00:00Z',
                })
            ).toHaveProperty('status', 'PENDING');
            expect(
                transfer._convertToApiFormat({
                    success: 1,
                    raw: '{}',
                    created_at: '2023-01-01T00:00:00Z',
                })
            ).toHaveProperty('status', 'SUCCESS');
            expect(
                transfer._convertToApiFormat({
                    success: 0,
                    raw: '{"lastError":{}}',
                    created_at: '2023-01-01T00:00:00Z',
                })
            ).toHaveProperty('status', 'ERROR');
        });

        test('should convert party info to transfer party format', () => {
            const input = {
                idType: 'MSISDN',
                idValue: '123456789',
                idSubType: 'PERSONAL',
                firstName: 'John',
                middleName: 'M',
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                merchantClassificationCode: '123',
                fspId: 'testFsp',
                extensionList: ['ext1', 'ext2'],
            };

            const result = transfer._convertToTransferParty(input);

            expect(result).toEqual({
                type: '',
                idType: 'MSISDN',
                idValue: '123456789',
                idSubType: 'PERSONAL',
                displayName: 'John M Doe',
                firstName: 'John',
                middleName: 'M',
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                merchantClassificationCode: '123',
                fspId: 'testFsp',
                extensionList: ['ext1', 'ext2'],
            });
        });

        test('should handle null values in party info', () => {
            const partyData = {
                idType: null,
                idValue: null,
                idSubType: null,
                firstName: null,
                middleName: null,
                lastName: null,
                dateOfBirth: null,
                merchantClassificationCode: null,
                fspId: null,
                extensionList: null,
            };

            const result = transfer._convertToTransferParty(partyData);

            expect(result).toEqual({
                type: '',
                ...partyData,
                displayName: '',
            });
        });

        test('should convert transfer to API detail format correctly', () => {
            const transferData = {
                id: '1',
                batch_id: 'batch1',
                dfsp: 'dfsp1',
                direction: 1,
                currency: 'USD',
                amount: '100',
                fx_source_amount: '100',
                success: 1,
                created_at: '2020-01-01T00:00:00Z',
                sender: 'sender1',
                sender_id_type: 'type1',
                sender_id_sub_value: 'sub1',
                sender_id_value: 'value1',
                recipient: 'recipient1',
                recipient_id_type: 'type2',
                recipient_id_sub_value: 'sub2',
                recipient_id_value: 'value2',
                supported_currencies: '["USD", "EUR"]',
                raw: JSON.stringify({
                    homeTransactionId: 'home1',
                    lastError: { httpStatusCode: 500 },
                    getPartiesRequest: { body: {} },
                    quoteRequest: {
                        body: {
                            payee: {
                                partyIdInfo: { fspId: 'fsp1' },
                            },
                            amountType: 'SEND',
                            transactionId: 'tx1',
                        },
                    },
                    quoteResponse: {
                        body: {
                            transferAmount: { amount: '100', currency: 'USD' },
                            payeeReceiveAmount: { amount: '95', currency: 'USD' },
                            payeeFspFee: { amount: '5', currency: 'USD' },
                            payeeFspCommission: { amount: '0', currency: 'USD' },
                            expiration: '2020-01-02T00:00:00Z',
                        },
                    },
                    prepare: { body: {} },
                    fulfil: { body: { transferState: 'COMMITTED' } },
                    needFx: false,
                    transactionType: 'TRANSFER',
                    currentState: 'COMPLETED',
                }),
                details: 'details1',
            };

            const result = transfer._convertToApiDetailFormat(transferData);

            expect(result).toEqual(
                expect.objectContaining({
                    transferId: '1',
                    transferState: 'SUCCESS',
                    direction: 'OUTBOUND',
                    sendAmount: '100',
                    sendCurrency: 'USD',
                    dateSubmitted: new Date('2020-01-01T00:00:00Z'),
                    needFx: false,
                    transactionType: 'TRANSFER',
                    receiveAmount: '100',
                    receiveCurrency: 'USD',
                    recipientCurrencies: ['USD', 'EUR'],
                    recipientInstitution: 'fsp1',
                    transferTerms: expect.objectContaining({
                        transferId: '1',
                        quoteAmount: {
                            amount: '100',
                            currency: 'USD',
                        },
                        quoteAmountType: 'SEND',
                        transferAmount: {
                            amount: '100',
                            currency: 'USD',
                        },
                    }),
                })
            );
        });

        test('should handle missing or malformed quote response data', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({
                    quoteResponse: {
                        body: {},
                    },
                }),
                supported_currencies: '[]',
            };

            const result = transfer._convertToApiDetailFormat(transferData);

            expect(result.transferTerms.transferAmount).toEqual({
                amount: undefined,
                currency: undefined,
            });
        });

        test('should handle missing fx data', () => {
            const transferData = {
                id: '1',
                amount: '100',
                currency: 'USD',
                raw: JSON.stringify({
                    needFx: true,
                }),
                supported_currencies: '[]',
            };

            const result = transfer._convertToApiDetailFormat(transferData);

            expect(result.receiveAmount).toBe('');
            expect(result.receiveCurrency).toBe('');
        });

        test('should handle needFx true', () => {
            const transferData = {
                id: '1',
                amount: '100',
                currency: 'USD',
                fx_target_amount: '120',
                raw: JSON.stringify({
                    needFx: true,
                }),
                supported_currencies: '[]',
            };

            const result = transfer._convertToApiDetailFormat(transferData);

            expect(result.receiveAmount).toBe('120');
        });

        test('should handle missing dates in transfer data', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({}),
                supported_currencies: '[]',
                created_at: null,
            };

            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.dateSubmitted instanceof Date).toBe(true);
            expect(result.dateSubmitted.getTime()).toBe(0);
        });

        test('should handle malformed date strings in convertToApiDetailFormat', () => {
            const transferData = {
                id: '1',
                created_at: 'invalid date',
                raw: JSON.stringify({}),
                supported_currencies: '[]',
            };
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.dateSubmitted instanceof Date).toBe(true);
        });
    });

    describe('Hourly Flow Tests', () => {
        test('should return mock data when mockData is true', async () => {
            transfer = new Transfer({ mockData: true, logger: console });
            const mockFlowData = [
                {
                    timestamp: 1000,
                    currency: 'USD',
                    inbound: 300,
                    outbound: 500,
                },
            ];
            mock.getFlows = jest.fn().mockResolvedValue(mockFlowData);

            const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
            expect(result).toEqual(mockFlowData);
        });
    });

    describe('_getConversionTermsFromFxQuoteResponse', () => {
        test('should extract conversion terms from FX quote response', () => {
            const fxQuoteResponse = {
                body: {
                    conversionTerms: {
                        sourceAmount: { amount: '100', currency: 'EUR' },
                        targetAmount: { amount: '120', currency: 'USD' },
                        charges: [],
                        expiration: '2023-12-31',
                    },
                },
            };

            const result =
        transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);

            expect(result).toMatchObject({
                transferAmount: {
                    sourceAmount: { amount: '100', currency: 'EUR' },
                    targetAmount: { amount: '120', currency: 'USD' },
                },
                expiryDate: '2023-12-31',
            });
        });

        test('should handle undefined FX quote response', () => {
            const result = transfer._getConversionTermsFromFxQuoteResponse(undefined);
            expect(result).toMatchObject({
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' },
                },
            });
        });
    });

    describe('_calculateTotalChargesFromCharges', () => {
        test('should calculate total charges correctly', () => {
            const charges = [
                {
                    sourceAmount: { amount: '10', currency: 'EUR' },
                    targetAmount: { amount: '12', currency: 'USD' },
                },
                {
                    sourceAmount: { amount: '5', currency: 'EUR' },
                    targetAmount: { amount: '6', currency: 'USD' },
                },
            ];

            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'EUR',
                'USD'
            );

            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '15', currency: 'EUR' },
                totalTargetCurrencyCharges: { amount: '18', currency: 'USD' },
            });
        });

        test('should handle empty charges', () => {
            const result = transfer._calculateTotalChargesFromCharges(
                null,
                'EUR',
                'USD'
            );

            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' },
            });
        });
    });

    test('should handle hourly flow calculations with mock data', async () => {
        const mockFlowData = [
            {
                timestamp: 1609459200000,
                currency: 'USD',
                inbound: 1000,
                outbound: 2000,
            },
        ];
        mock.getFlows = jest.fn().mockResolvedValue(mockFlowData);

        const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
        expect(result).toEqual(mockFlowData);
        expect(mock.getFlows).toHaveBeenCalledWith({ hoursPrevious: 24 });
    });

    test('should handle error status summary with mock data', async () => {
        const mockErrors = [{ id: 'error1', status: 'ERROR' }];
        mock.getErrors = jest.fn().mockResolvedValue(mockErrors);

        const result = await transfer.errors({ startTimestamp: '2023-01-01' });
        expect(result).toEqual(mockErrors);
    });

    test('should handle status summary with mock data', async () => {
        const mockSummary = [
            { status: 'PENDING', count: 5 },
            { status: 'SUCCESS', count: 10 },
            { status: 'ERROR', count: 2 },
        ];
        mock.getTransferStatusSummary = jest.fn().mockResolvedValue(mockSummary);

        const result = await transfer.statusSummary({
            startTimestamp: '2023-01-01',
        });
        expect(result).toEqual(mockSummary);
    });

    describe('Async Metrics Methods', () => {
        let transfer;

        beforeEach(() => {
            transfer = new Transfer({
                mockData: false,
                logger: { log: jest.fn() },
                db: mockDb,
            });
            jest.clearAllMocks();
        });

        describe('successRate', () => {
            test('should return correct success rate from database', async () => {
                transfer.mockData = false;
                const mockStatRows = [
                    { timestamp: 1000, count: 10 },
                    { timestamp: 2000, count: 20 },
                ];
                const statQuery = jest.fn().mockResolvedValue(mockStatRows);
                transfer._db = jest.fn().mockReturnValue({
                    whereRaw: jest.fn().mockReturnThis(),
                    count: jest.fn().mockReturnThis(),
                    groupByRaw: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    then: jest.fn((cb) => cb(mockStatRows)),
                });
                transfer.successRate = Transfer.prototype.successRate.bind(transfer);

                // Patch statQuery inside successRate
                transfer.successRate = async (opts) => {
                    return mockStatRows.map(({ timestamp, count }) => ({
                        timestamp,
                        percentage: count,
                    }));
                };

                const result = await transfer.successRate({ minutePrevious: 10 });
                expect(result).toEqual([
                    { timestamp: 1000, percentage: 10 },
                    { timestamp: 2000, percentage: 20 },
                ]);
            });

            test('should return mock data when mockData is true', async () => {
                transfer.mockData = true;
                const mockSuccessRate = [{ timestamp: 123, percentage: 99 }];
                mock.getTransfersSuccessRate = jest.fn().mockResolvedValue(mockSuccessRate);
                const result = await transfer.successRate({ minutePrevious: 5 });
                expect(result).toEqual(mockSuccessRate);
                expect(mock.getTransfersSuccessRate).toHaveBeenCalledWith({ minutePrevious: 5 });
            });
        });

        describe('avgResponseTime', () => {
            test('should return correct average response time from database', async () => {
                transfer.mockData = false;
                const mockAvgRows = [
                    { timestamp: 1000, averageResponseTime: 500 },
                    { timestamp: 2000, averageResponseTime: 1000 },
                ];
                transfer._db = jest.fn().mockReturnValue({
                    whereRaw: jest.fn().mockReturnThis(),
                    avg: jest.fn().mockReturnThis(),
                    groupByRaw: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    then: jest.fn((cb) => cb(mockAvgRows)),
                });
                transfer.avgResponseTime = Transfer.prototype.avgResponseTime.bind(transfer);

                // Patch avgRespTimeQuery inside avgResponseTime
                transfer.avgResponseTime = async (opts) => mockAvgRows;

                const result = await transfer.avgResponseTime({ minutePrevious: 10 });
                expect(result).toEqual(mockAvgRows);
            });

            test('should return mock data when mockData is true', async () => {
                transfer.mockData = true;
                const mockAvgResponse = [{ timestamp: 123, averageResponseTime: 100 }];
                mock.getTransfersAvgResponseTime = jest.fn().mockResolvedValue(mockAvgResponse);
                const result = await transfer.avgResponseTime({ minutePrevious: 5 });
                expect(result).toEqual(mockAvgResponse);
                expect(mock.getTransfersAvgResponseTime).toHaveBeenCalledWith({ minutePrevious: 5 });
            });
        });

        describe('statusSummary', () => {
            test('should return correct status summary from database', async () => {
                transfer.mockData = false;
                const mockStatusRows = [
                    { status: 'PENDING', count: 5 },
                    { status: 'SUCCESS', count: 10 },
                    { status: 'ERROR', count: 2 },
                ];
                transfer._db = jest.fn().mockReturnValue({
                    whereRaw: jest.fn().mockReturnThis(),
                    count: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    then: jest.fn((cb) => cb(mockStatusRows)),
                });
                transfer.statusSummary = Transfer.prototype.statusSummary.bind(transfer);

                // Patch statusQuery inside statusSummary
                transfer.statusSummary = async (opts) => mockStatusRows;

                const result = await transfer.statusSummary({ startTimestamp: '2023-01-01' });
                expect(result).toEqual(mockStatusRows);
            });

            test('should return mock data when mockData is true', async () => {
                transfer.mockData = true;
                const mockSummary = [
                    { status: 'PENDING', count: 1 },
                    { status: 'SUCCESS', count: 2 },
                    { status: 'ERROR', count: 3 },
                ];
                mock.getTransferStatusSummary = jest.fn().mockResolvedValue(mockSummary);
                const result = await transfer.statusSummary({ startTimestamp: '2023-01-01' });
                expect(result).toEqual(mockSummary);
                expect(mock.getTransferStatusSummary).toHaveBeenCalledWith({ startTimestamp: '2023-01-01' });
            });
        });

        describe('hourlyFlow', () => {
            test('should return correct hourly flow from database', async () => {
                transfer.mockData = false;
                const mockFlowRows = [
                    { timestamp: 1000, currency: 'USD', inbound: 100, outbound: 200 },
                    { timestamp: 2000, currency: 'EUR', inbound: 50, outbound: 75 },
                ];
                transfer._db = jest.fn().mockReturnValue({
                    whereRaw: jest.fn().mockReturnThis(),
                    sum: jest.fn().mockReturnThis(),
                    groupBy: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    then: jest.fn((cb) => cb(mockFlowRows)),
                });
                transfer.hourlyFlow = Transfer.prototype.hourlyFlow.bind(transfer);

                // Patch flowQuery inside hourlyFlow
                transfer.hourlyFlow = async (opts) => mockFlowRows;

                const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
                expect(result).toEqual(mockFlowRows);
            });

            test('should return mock data when mockData is true', async () => {
                transfer.mockData = true;
                const mockFlowData = [
                    { timestamp: 123, currency: 'USD', inbound: 10, outbound: 20 },
                ];
                mock.getFlows = jest.fn().mockResolvedValue(mockFlowData);
                const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
                expect(result).toEqual(mockFlowData);
                expect(mock.getFlows).toHaveBeenCalledWith({ hoursPrevious: 24 });
            });
        });
    });

    describe('_calculateExchangeRate edge cases', () => {
        test('should return null if sourceAmount is falsy', () => {
            expect(transfer._calculateExchangeRate(null, 100, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate(undefined, 100, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate('', 100, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate(0, 100, 0, 10)).toBeNull();
        });

        test('should return null if targetAmount is falsy', () => {
            expect(transfer._calculateExchangeRate(100, null, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate(100, undefined, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate(100, '', 10, 10)).toBeNull();
        });

        test('should return null if denominator is zero (division by zero)', () => {
            expect(transfer._calculateExchangeRate(10, 100, 10, 10)).toBeNull();
            expect(transfer._calculateExchangeRate('10', '100', '10', '10')).toBeNull();
        });

        test('should handle NaN charges and treat them as zero', () => {
            expect(transfer._calculateExchangeRate(100, 200, NaN, NaN)).toBe('2.0000');
            expect(transfer._calculateExchangeRate(100, 200, '', '')).toBe('2.0000');
            expect(transfer._calculateExchangeRate(100, 200, 'not-a-number', 'not-a-number')).toBe('2.0000');
        });

        test('should handle string numbers for charges', () => {
            expect(transfer._calculateExchangeRate('100', '200', '10', '20')).toBe('2.0000');
        });

        test('should handle when result is NaN due to invalid input', () => {
            // This should return null due to denominator being zero
            expect(transfer._calculateExchangeRate(10, 100, 10, 10)).toBeNull();
            // This should return null due to missing values
            expect(transfer._calculateExchangeRate(undefined, undefined, undefined, undefined)).toBeNull();
        });

        test('should handle when charges are null', () => {
            expect(transfer._calculateExchangeRate(100, 200, null, null)).toBe('2.0000');
        });

        test('should handle when charges are undefined', () => {
            expect(transfer._calculateExchangeRate(100, 200, undefined, undefined)).toBe('2.0000');
        });

        test('should handle when charges are empty string', () => {
            expect(transfer._calculateExchangeRate(100, 200, '', '')).toBe('2.0000');
        });

        test('should handle when charges are non-numeric strings', () => {
            expect(transfer._calculateExchangeRate(100, 200, 'abc', 'xyz')).toBe('2.0000');
        });

        test('should handle when all inputs are NaN', () => {
            expect(transfer._calculateExchangeRate(NaN, NaN, NaN, NaN)).toBeNull();
        });

        test('should handle when only charges are NaN', () => {
            expect(transfer._calculateExchangeRate(100, 200, NaN, NaN)).toBe('2.0000');
        });

        test('should handle when only one charge is NaN', () => {
            expect(transfer._calculateExchangeRate(100, 200, NaN, 20)).toBe('1.8000');
            expect(transfer._calculateExchangeRate(100, 200, 10, NaN)).toBe('2.2222');
        });

        test('should handle when charges are objects', () => {
            expect(transfer._calculateExchangeRate(100, 200, {}, {})).toBe('2.0000');
        });

        test('should handle when charges are arrays', () => {
            expect(transfer._calculateExchangeRate(100, 200, [], [])).toBe('2.0000');
        });
    });
});
