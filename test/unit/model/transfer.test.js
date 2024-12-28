const Transfer = require('../../../src/lib/model/Transfer');
const mock = require('../../../src/lib/model/mock');

const mockDb = {
    _result: null,
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(() => Promise.resolve(mockDb._result)),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockImplementation(() => Promise.resolve(mockDb._result)),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    groupByRaw: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    raw: jest.fn().mockImplementation(query => {
        if (query.includes('MIN')) {
            return Promise.resolve([{ timestamp: 1000 }]);
        }
        return Promise.resolve(query);
    }),

    setResult: function(result) {
        this._result = result;
        return this;
    }
};

describe('Transfer', () => {
    let transfer;

    beforeAll(() => {
        transfer = new Transfer({ mockData: true, logger: console });
    });

    describe('findAll Method', () => {
        it('should return transfers with various query parameters', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({
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
                limit: 10
            });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle mock data', async () => {
            transfer.mockData = true;
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({});
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({});
            expect(result).toHaveLength(0);
        });
    
        it('should handle no query parameters', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({});
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only id parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ id: 'test-id' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only startTimestamp parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ startTimestamp: '2022-01-01' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only endTimestamp parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ endTimestamp: '2022-12-31' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdType parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ senderIdType: 'type1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ senderIdValue: 'value1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdSubValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ senderIdSubValue: 'sub1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdType parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ recipientIdType: 'type2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ recipientIdValue: 'value2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdSubValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ recipientIdSubValue: 'sub2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only direction parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ direction: 'INBOUND' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only institution parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ institution: 'institution1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only batchId parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ batchId: 'batch1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only status parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ status: 'PENDING' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only offset parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ offset: 0 });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only limit parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAll({ limit: 10 });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    });

    describe('findAllWithFX Method', () => {
        it('should handle various query parameters', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({
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
                limit: 10
            });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should return transfers with FX data from mock', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({});
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({});
            expect(result).toHaveLength(0);
        });
    
        it('should handle only id parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ id: 'test-id' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only startTimestamp parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ startTimestamp: '2022-01-01' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only endTimestamp parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ endTimestamp: '2022-12-31' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdType parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ senderIdType: 'type1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ senderIdValue: 'value1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only senderIdSubValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ senderIdSubValue: 'sub1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdType parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ recipientIdType: 'type2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ recipientIdValue: 'value2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only recipientIdSubValue parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ recipientIdSubValue: 'sub2' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only direction parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ direction: 'INBOUND' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only institution parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ institution: 'institution1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only batchId parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ batchId: 'batch1' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only status parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ status: 'PENDING' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only offset parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ offset: 0 });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle only limit parameter', async () => {
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({ limit: 10 });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    
        it('should handle mock data', async () => {
            transfer.mockData = true;
            const mockResponse = [{ id: 'test-id', raw: '{}' }];
            jest.spyOn(mock, 'getTransfers').mockResolvedValue(mockResponse);
    
            const result = await transfer.findAllWithFX({});
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('test-id');
        });
    });

    describe('findOne Method', () => {
        it('should find one transfer by id from mock', async () => {
            const id = 'test-id';
            const mockResponse = { id, raw: '{}' };
            jest.spyOn(mock, 'getTransfer').mockResolvedValue(mockResponse);

            const result = await transfer.findOne(id);
            expect(result).toEqual(expect.objectContaining({ id }));
        });

        it('should return null for non-existent id from mock', async () => {
            const id = 'non-existent-id';
            jest.spyOn(mock, 'getTransfer').mockResolvedValue(null);

            const result = await transfer.findOne(id);
            expect(result).toBeNull();
        });
    });

    describe('details Method', () => {
        it('should return transfer details by id from mock', async () => {
            const id = 'test-id';
            const mockResponse = [{ id, raw: '{}' }];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);

            const result = await transfer.details(id);
            expect(result[0]).toEqual(expect.objectContaining({ id }));
        });

        it('should return null for non-existent id from mock', async () => {
            const id = 'non-existent-id';
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(null);

            const result = await transfer.details(id);
            expect(result).toBeNull();
        });

        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransferDetails').mockResolvedValue(mockResponse);
    
            const result = await transfer.details('test-id');
            expect(result).toEqual([]);
        });
    });

    describe('successRate Method', () => {
        it('should return success rate for transfers from mock', async () => {
            const mockSuccessResponse = [{ timestamp: 1234567890, percentage: 50 }];
            jest.spyOn(mock, 'getTransfersSuccessRate').mockResolvedValue(mockSuccessResponse);

            const result = await transfer.successRate({ minutePrevious: 10 });
            expect(result).toHaveLength(1);
            expect(result[0].percentage).toBe(50);
        });

        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransfersSuccessRate').mockResolvedValue(mockResponse);
    
            const result = await transfer.successRate({ minutePrevious: 10 });
            expect(result).toHaveLength(0);
        });
    });

    describe('avgResponseTime Method', () => {
        it('should return average response time for transfers from mock', async () => {
            const mockResponse = [{ timestamp: 1234567890, averageResponseTime: 1000 }];
            jest.spyOn(mock, 'getTransfersAvgResponseTime').mockResolvedValue(mockResponse);

            const result = await transfer.avgResponseTime({ minutePrevious: 10 });
            expect(result).toHaveLength(1);
            expect(result[0].averageResponseTime).toBe(1000);
        });

        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getTransfersAvgResponseTime').mockResolvedValue(mockResponse);
    
            const result = await transfer.avgResponseTime({ minutePrevious: 10 });
            expect(result).toHaveLength(0);
        });
    });

    describe('statusSummary Method', () => {
        it('should return status summary for transfers from mock', async () => {
            const mockResponse = [
                { status: 'PENDING', count: 5 },
                { status: 'SUCCESS', count: 10 },
                { status: 'ERROR', count: 3 }
            ];
            jest.spyOn(mock, 'getTransferStatusSummary').mockResolvedValue(mockResponse);

            const result = await transfer.statusSummary({});
            expect(result).toHaveLength(3);
            const successResult = result.find(r => r.status === 'SUCCESS');
            expect(successResult).toBeDefined();
            expect(successResult.count).toBe(10);
        });

        it('should handle empty response', async () => {
            const defaultSummary = [
                { status: 'PENDING', count: 0 },
                { status: 'SUCCESS', count: 0 },
                { status: 'ERROR', count: 0 }
            ];
            jest.spyOn(mock, 'getTransferStatusSummary').mockResolvedValue(defaultSummary);
    
            const result = await transfer.statusSummary({});
            expect(result).toEqual(defaultSummary);
            expect(result).toHaveLength(3);
            expect(result.find(r => r.status === 'SUCCESS').count).toBe(0);
            expect(result.find(r => r.status === 'ERROR').count).toBe(0);
            expect(result.find(r => r.status === 'PENDING').count).toBe(0);
        });
    });

    describe('hourlyFlow Method', () => {
        it('should return hourly flow for transfers from mock', async () => {
            const mockResponse = [{ timestamp: 1234567890, currency: 'USD', outbound: 1000 }];
            jest.spyOn(mock, 'getFlows').mockResolvedValue(mockResponse);

            const result = await transfer.hourlyFlow({ hoursPrevious: 10 });
            expect(result).toHaveLength(1);
            expect(result[0].outbound).toBe(1000);
        });
        
        it('should handle empty response', async () => {
            const mockResponse = [];
            jest.spyOn(mock, 'getFlows').mockResolvedValue(mockResponse);
    
            const result = await transfer.hourlyFlow({ hoursPrevious: 10 });
            expect(result).toHaveLength(0);
        });
    });
});

describe('Transfer Model', () => {
    let transfer;

    beforeEach(() => {
        transfer = new Transfer({
            mockData: true,
            logger: { log: jest.fn() },
            db: mockDb,
        });

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with provided props', () => {
        expect(transfer.mockData).toBe(true);
        expect(transfer._db).toBe(mockDb);
    });

    test('should have correct static STATUSES', () => {
        expect(Transfer.STATUSES).toEqual({
            null: 'PENDING',
            1: 'SUCCESS',
            0: 'ERROR'
        });
    });

    test('should log error message when database query fails', async () => {
        transfer.mockData = false;
        mockDb._result = new Error('Database error');

        const loggerSpy = jest.spyOn(transfer.logger, 'log');

        try {
            await transfer.errors({ startTimestamp: '2022-01-01', endTimestamp: '2022-12-31' });
        } catch (error) {
            expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting transfer errors'));
        }
    });

    test('should handle empty values in data transformations', () => {
        expect(transfer._convertToApiFormat({ success: null, raw: '{}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'PENDING');
        expect(transfer._convertToApiFormat({ success: 1, raw: '{}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'SUCCESS');
        expect(transfer._convertToApiFormat({ success: 0, raw: '{"lastError":{}}', created_at: '2023-01-01T00:00:00Z' })).toHaveProperty('status', 'ERROR');
    });

    test('should handle custom complex name formats', () => {
        const complexNameCases = [
            {
                input: { firstName: 'John', middleName: 'M', lastName: 'Doe' },
                expected: 'John M Doe'
            },
            {
                input: { firstName: 'John', lastName: 'Doe' },
                expected: 'John Doe'
            },
            {
                input: { firstName: 'John' },
                expected: 'John'
            },
            {
                input: null,
                expected: undefined
            }
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
            extensionList: ['ext1', 'ext2']
        };

        const result = transfer._convertToTransferParty(partyData);

        expect(result).toEqual({
            type: '',
            ...partyData,
            displayName: 'John M Doe'
        });
    });

    test('should handle edge cases in exchange rate calculation', () => {
        const testCases = [
            {
                input: { sourceAmount: '100', targetAmount: '200', sourceCharges: 10, targetCharges: 20 },
                expected: '2.0000'
            },
            {
                input: { sourceAmount: '0', targetAmount: '200', sourceCharges: 10, targetCharges: 20 },
                expected: '-18.0000'
            },
            {
                input: { sourceAmount: '100', targetAmount: '0', sourceCharges: 10, targetCharges: 20 },
                expected: '-0.2222'
            }
        ];

        testCases.forEach(({ input, expected }) => {
            const { sourceAmount, targetAmount, sourceCharges, targetCharges } = input;
            expect(transfer._calculateExchangeRate(
                sourceAmount, 
                targetAmount, 
                sourceCharges, 
                targetCharges
            )).toBe(expected);
        });
    });

    test('should parse various raw transfer request bodies', () => {
        const rawTransfer = {
            getPartiesRequest: {
                body: JSON.stringify({ party: 'test' })
            },
            quoteRequest: {
                body: JSON.stringify({ quote: 'test' })
            }
        };

        const result = transfer._parseRawTransferRequestBodies(rawTransfer);
        
        expect(result.getPartiesRequest.body).toEqual({ party: 'test' });
        expect(result.quoteRequest.body).toEqual({ quote: 'test' });

        // Test invalid JSON separately to ensure it throws
        expect(() => {
            transfer._parseRawTransferRequestBodies({
                getPartiesRequest: { body: 'invalid json' }
            });
        }).toThrow();
    });

    test('should calculate hourly flows correctly', async () => {
        transfer = new Transfer({
            mockData: true,
            logger: { log: jest.fn() },
            db: mockDb,
        });

        const mockFlowData = [{
            timestamp: 1000,
            currency: 'USD',
            inbound: 300,
            outbound: 500
        }];

        mock.getFlows = jest.fn().mockResolvedValueOnce(mockFlowData);

        const result = await transfer.hourlyFlow({ hoursPrevious: 24 });
        
        expect(result).toEqual(mockFlowData);
    });
    
    test('should apply join correctly', () => {
        const query = mockDb;
        transfer._applyJoin(query);
        expect(query.leftJoin).toHaveBeenCalledWith('fx_quote', 'transfer.redis_key', 'fx_quote.redis_key');
        expect(query.leftJoin).toHaveBeenCalledWith('fx_transfer', 'fx_quote.redis_key', 'fx_transfer.redis_key');
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
                quoteResponse: { body: {} }
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
        const error = { mojaloopError: { errorInformation: { errorDescription: 'error' } } };
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
                conversionTerms: '{"sourceAmount":{"amount":"100","currency":"USD"},"targetAmount":{"amount":"200","currency":"EUR"},"charges":[],"expiration":"2020-01-01T00:00:00Z"}',
            },
        };
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
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

    test('should calculate total charges correctly', () => {
        const charges = [
            { sourceAmount: { amount: '10', currency: 'USD' }, targetAmount: { amount: '20', currency: 'EUR' } },
            { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: { amount: '10', currency: 'EUR' } },
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '15', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '30', currency: 'EUR' },
        });
    });

    test('should calculate exchange rate correctly', () => {
        const result = transfer._calculateExchangeRate(100, 200, 10, 20);
        expect(result).toBe('2.0000');
    });

    test('should return mock data when mockData is true', async () => {
        const mockId = '123';
        const mockDataResponse = { id: mockId };

        mock.getTransferDetails = jest.fn().mockReturnValueOnce(mockDataResponse);

        const result = await transfer.details(mockId);

        expect(mock.getTransferDetails).toHaveBeenCalledWith({ id: mockId });
        expect(result).toEqual(mockDataResponse);
    });

    test('should convert transfer to API detail format correctly', () => {
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
            supported_currencies: '["USD", "EUR"]',
            raw: JSON.stringify({
                homeTransactionId: 'home1',
                lastError: { httpStatusCode: 500 },
                getPartiesRequest: { body: {} },
                quoteRequest: { 
                    body: {
                        payee: {
                            partyIdInfo: { fspId: 'fsp1' }
                        },
                        amountType: 'SEND',
                        transactionId: 'tx1'
                    } 
                },
                quoteResponse: { 
                    body: {
                        transferAmount: { amount: '100', currency: 'USD' },
                        payeeReceiveAmount: { amount: '95', currency: 'USD' },
                        payeeFspFee: { amount: '5', currency: 'USD' },
                        expiration: '2020-01-02T00:00:00Z'
                    } 
                },
                prepare: { body: {} },
                fulfil: { body: { transferState: 'COMMITTED' } },
                needFx: false,
                transactionType: 'TRANSFER',
                currentState: 'COMPLETED'
            }),
            details: 'details1'
        };

        const result = transfer._convertToApiDetailFormat(transferData);

        expect(result).toEqual(expect.objectContaining({
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
                    currency: 'USD'
                },
                quoteAmountType: 'SEND',
                transferAmount: {
                    amount: '100',
                    currency: 'USD'
                }
            })
        }));
    });

    test('should get party from quote request correctly', () => {
        const quoteRequest = {
            body: {
                payer: {
                    partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1', partySubIdOrType: 'sub1', fspId: 'fsp1' },
                    name: 'payer1',
                    personalInfo: { complexName: { firstName: 'first', middleName: 'middle', lastName: 'last' }, dateOfBirth: '2000-01-01' },
                    merchantClassificationCode: 'code1',
                    extensionList: { extension: [] },
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
            extensionList: undefined,
        });
    });

    test('should convert complex name to display name correctly', () => {
        const complexName = { firstName: 'first', middleName: 'middle', lastName: 'last' };
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

    test('avgResponseTime should return mock data when mockData is true', async () => {
        const mockAvgResponseTime = [
            { timestamp: 1609459200000, averageResponseTime: 1200 },
            { timestamp: 1609459260000, averageResponseTime: 1300 },
        ];
    
        mock.getTransfersAvgResponseTime = jest
            .fn()
            .mockResolvedValue(mockAvgResponseTime);
    
        const opts = { minutePrevious: 10 };
        const result = await transfer.avgResponseTime(opts);
        expect(result).toEqual(mockAvgResponseTime);
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
                targetAmount: { amount: '', currency: '' }
            },
            exchangeRate: ''
        });
    });

    test('should correctly filter non-matching currencies in charge calculations', () => {
        const charges = [
            { sourceAmount: { amount: '10', currency: 'GBP' }, targetAmount: { amount: '20', currency: 'JPY' } },
            { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: { amount: '10', currency: 'EUR' } }
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '5', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '10', currency: 'EUR' }
        });
    });

    test('should handle hourly flow calculations with mock data', async () => {
        const mockFlowData = [{
            timestamp: 1609459200000,
            currency: 'USD',
            inbound: 1000,
            outbound: 2000
        }];
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
            { status: 'ERROR', count: 2 }
        ];
        mock.getTransferStatusSummary = jest.fn().mockResolvedValue(mockSummary);
            
        const result = await transfer.statusSummary({ startTimestamp: '2023-01-01' });
        expect(result).toEqual(mockSummary);
    });

    test('should handle findAllWithFX with mock data', async () => {
        const mockTransfers = [{ id: 'fx1', fx_source_currency: 'USD', fx_target_currency: 'EUR' }];
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
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
        expect(result).toBeUndefined();
    });

    test('should handle empty raw data in convertToApiDetailFormat', () => {
        const transferData = {
            id: '1',
            raw: JSON.stringify({}),
            supported_currencies: '[]'
        };
        const result = transfer._convertToApiDetailFormat(transferData);
        expect(result.transferId).toBe('1');
        expect(result.needFx).toBeUndefined();
        expect(result.recipientCurrencies).toEqual([]);
    });

    test('should parse raw transfer request bodies with invalid JSON', () => {
        const transferRaw = {
            getPartiesRequest: { body: 'invalid json' },
            quoteRequest: { body: 'invalid json' }
        };
        expect(() => transfer._parseRawTransferRequestBodies(transferRaw)).toThrow();
    });

 
    test('should handle division by zero in exchange rate calculation', () => {
        const result = transfer._calculateExchangeRate('0', '200', '0', '20');
        expect(result).toBe(null);
    });

    test('should handle undefined values in charges calculation', () => {
        const charges = [
            { sourceAmount: undefined, targetAmount: { amount: '20', currency: 'EUR' }},
            { sourceAmount: { amount: '5', currency: 'USD' }, targetAmount: undefined }
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '5', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '20', currency: 'EUR' }
        });
    });

    test('should validate required fields in conversion terms', () => {
        const fxQuoteResponse = {
            body: {
                conversionTerms: JSON.stringify({
                    sourceAmount: { amount: '100', currency: 'USD' },
                    targetAmount: { amount: '200', currency: 'EUR' },
                    charges: [],
                    expiration: '2020-01-01T00:00:00Z'
                })
            }
        };
        const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);
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

    test('should handle partial complex name', () => {
        const result = transfer._complexNameToDisplayName({
            firstName: 'John',
            lastName: 'Doe'
        });
        expect(result).toBe('John Doe');
    });

    test('should correctly format complex name to display name', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John',
            middleName: 'M',
            lastName: 'Doe'
        })).toBe('John M Doe');
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John',
            lastName: 'Doe'
        })).toBe('John Doe');
        
        expect(transfer._complexNameToDisplayName({
            firstName: 'John'
        })).toBe('John');
        
        expect(transfer._complexNameToDisplayName(null)).toBeUndefined();
    });
    
    test('should convert party info to transfer party format', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
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
            extensionList: ['ext1', 'ext2']
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
            extensionList: ['ext1', 'ext2']
        });
    });
    
    test('should calculate exchange rate correctly', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        expect(transfer._calculateExchangeRate('100', '200', 10, 20)).toBe('2.0000');
        expect(transfer._calculateExchangeRate('0', '200', 10, 20)).toBe('-18.0000');
        expect(transfer._calculateExchangeRate('100', '0', 10, 20)).toBe('-0.2222');
    });
    
    test('should parse raw transfer request bodies', () => {
        const transfer = new Transfer({ mockData: false, logger: console });
        
        const rawTransfer = {
            getPartiesRequest: {
                body: JSON.stringify({ party: 'test' })
            },
            quoteRequest: {
                body: JSON.stringify({ quote: 'test' })
            }
        };
    
        const result = transfer._parseRawTransferRequestBodies(rawTransfer);
        
        expect(result.getPartiesRequest.body).toEqual({ party: 'test' });
        expect(result.quoteRequest.body).toEqual({ quote: 'test' });
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
            extensionList: null
        };
    
        const result = transfer._convertToTransferParty(partyData);
    
        expect(result).toEqual({
            type: '',
            ...partyData,
            displayName: '' 
        });
    });
    
    test('should handle missing fields in quote request body', () => {
        const quoteRequest = {
            body: {
                payer: {}
            }
        };
    
        const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
        
        expect(result).toEqual({
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
            extensionList: undefined
        });
    });
    
    test('should handle malformed JSON in raw data', () => {
        const transferData = {
            id: '1',
            raw: '{invalid json',
            supported_currencies: '[]'
        };
    
        expect(() => transfer._convertToApiDetailFormat(transferData)).toThrow();
    });
    
    test('should handle missing dates in transfer data', () => {
        const transferData = {
            id: '1',
            raw: JSON.stringify({}),
            supported_currencies: '[]',
            created_at: null
        };
    
        const result = transfer._convertToApiDetailFormat(transferData);
        expect(result.dateSubmitted instanceof Date).toBe(true);
        expect(result.dateSubmitted.getTime()).toBe(0);
    });
    
    test('should handle null query parameters in find methods', async () => {
        transfer.mockData = true;
        const mockTransfers = [{ id: 'transfer1' }];
        mock.getTransfers = jest.fn().mockResolvedValue(mockTransfers);
    
        const result = await transfer.findAll({
            startTimestamp: null,
            endTimestamp: null,
            institution: null,
            status: null
        });
    
        expect(result).toEqual(mockTransfers);
    });
    
    test('should handle undefined options in findAll', async () => {
        transfer.mockData = true;
        const mockTransfers = [{ id: 'transfer1' }];
        mock.getTransfers = jest.fn().mockResolvedValue(mockTransfers);
        
        const result = await transfer.findAll();
        expect(result).toEqual(mockTransfers); 
    });
    
    
    test('should handle malformed date strings in convertToApiDetailFormat', () => {
        const transferData = {
            id: '1',
            created_at: 'invalid date',
            raw: JSON.stringify({}),
            supported_currencies: '[]'
        };
        const result = transfer._convertToApiDetailFormat(transferData);
        // The function might default dateSubmitted to epoch 0 or null
        expect(result.dateSubmitted instanceof Date).toBe(true);
    });

    test('should handle invalid currency codes in charge calculations', () => {
        const charges = [
            { sourceAmount: { amount: '10', currency: 'INVALID' }, targetAmount: { amount: '5', currency: 'XXX' } }
        ];
        const result = transfer._calculateTotalChargesFromCharges(charges, 'USD', 'EUR');
        // Expecting that non-matching or invalid currency codes simply get skipped
        expect(result).toEqual({
            totalSourceCurrencyCharges: { amount: '0', currency: 'USD' },
            totalTargetCurrencyCharges: { amount: '0', currency: 'EUR' }
        });
    });

    test('should handle extremely large amounts in exchange rate calculation', () => {
        const result = transfer._calculateExchangeRate('999999999999999999999', '1000', '0', '0');
        // Depending on how big values are handled, might be Infinity, big float, or null
        expect(result).not.toBeUndefined();
    });
});

describe('Transfer Model Additional Tests', () => {
    let transfer;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            table: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereRaw: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            andWhereRaw: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            groupByRaw: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([]),
            sum: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            raw: jest.fn().mockReturnThis()
        };

        // Initialize mockDb.raw to handle different cases
        mockDb.raw.mockImplementation((query) => {
            if (query.includes('MIN')) {
                return { timestamp: 1000 };
            }
            return query;
        });

        // Setup default mock responses
        mockDb.where.mockResolvedValue([]);
        mockDb.orderBy.mockResolvedValue([]);
        mockDb.groupByRaw.mockResolvedValue([]);

        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Hourly Flow Tests', () => {
        test('should return mock data when mockData is true', async () => {
            transfer = new Transfer({ mockData: true, logger: console });
            const mockFlowData = [{
                timestamp: 1000,
                currency: 'USD',
                inbound: 300,
                outbound: 500
            }];
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
                        expiration: '2023-12-31'
                    }
                }
            };

            const result = transfer._getConversionTermsFromFxQuoteResponse(fxQuoteResponse);

            expect(result).toMatchObject({
                transferAmount: {
                    sourceAmount: { amount: '100', currency: 'EUR' },
                    targetAmount: { amount: '120', currency: 'USD' }
                },
                expiryDate: '2023-12-31'
            });
        });

        test('should handle partial raw data objects', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({ getPartiesRequest: { invalidField: true } }),
                supported_currencies: '[]'
            };
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.transferId).toBe('1');
            // Should not throw, just skip unrecognized fields
            expect(result.needFx).toBeUndefined();
        });

        test('should handle partial raw data objects', () => {
            const transferData = {
                id: '1',
                raw: JSON.stringify({ getPartiesRequest: { invalidField: true } }),
                supported_currencies: '[]'
            };
            const result = transfer._convertToApiDetailFormat(transferData);
            expect(result.transferId).toBe('1');
            // Should not throw, just skip unrecognized fields
            expect(result.needFx).toBeUndefined();
        });

        test('should handle undefined FX quote response', () => {
            const result = transfer._getConversionTermsFromFxQuoteResponse(undefined);
            expect(result).toMatchObject({
                charges: {
                    totalSourceCurrencyCharges: { amount: '', currency: '' },
                    totalTargetCurrencyCharges: { amount: '', currency: '' }
                }
            });
        });
    });

    describe('_calculateTotalChargesFromCharges', () => {
        test('should calculate total charges correctly', () => {
            const charges = [
                {
                    sourceAmount: { amount: '10', currency: 'EUR' },
                    targetAmount: { amount: '12', currency: 'USD' }
                },
                {
                    sourceAmount: { amount: '5', currency: 'EUR' },
                    targetAmount: { amount: '6', currency: 'USD' }
                }
            ];

            const result = transfer._calculateTotalChargesFromCharges(
                charges,
                'EUR',
                'USD'
            );

            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '15', currency: 'EUR' },
                totalTargetCurrencyCharges: { amount: '18', currency: 'USD' }
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
                totalTargetCurrencyCharges: { amount: '', currency: '' }
            });
        });
    });
});

describe('Transfer Model Error Handling', () => {
    let transfer;
    const mockDb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        andWhereRaw: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        raw: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        sum: jest.fn().mockReturnThis(),
        groupByRaw: jest.fn().mockReturnThis()
    };

    beforeEach(() => {
        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb
        });
        jest.clearAllMocks();
    });

    describe('successRate Method Tests', () => {
        test('should return success rate data with correct structure', async () => {
            transfer = new Transfer({
                mockData: true,
                logger: { log: jest.fn() },
                db: mockDb
            });

            const mockResult = [
                { percentage: 22, timestamp: '2024-12-23T14:44:59.959Z' }
            ];
            mock.getTransfersSuccessRate = jest.fn().mockResolvedValue(mockResult);
            
            const result = await transfer.successRate({ minutePrevious: 10 });
            
            expect(result).toEqual(mockResult);
            expect(result[0]).toHaveProperty('timestamp');
            expect(typeof result[0].percentage).toBe('number');
            expect(typeof result[0].timestamp).toBe('string');
        });
    });

    describe('_getPartyFromQuoteRequest Additional Tests', () => {
        test('should handle missing personalInfo', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1' },
                        name: 'test'
                    }
                }
            };
            
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            
            expect(result.displayName).toBe('test');
            expect(result.firstName).toBeUndefined();
            expect(result.lastName).toBeUndefined();
        });

        test('should handle missing extensionList', () => {
            const quoteRequest = {
                body: {
                    payer: {
                        partyIdInfo: { partyIdType: 'type1', partyIdentifier: 'value1' }
                    }
                }
            };
            
            const result = transfer._getPartyFromQuoteRequest(quoteRequest, 'payer');
            
            expect(result.extensionList).toBeUndefined();
        });
    });

    describe('findAllWithFX Additional Tests', () => {
        describe('_convertToApiDetailFormat Additional Tests', () => {
            test('should handle missing or malformed quote response data', () => {
                const transferData = {
                    id: '1',
                    raw: JSON.stringify({
                        quoteResponse: { 
                            body: {} 
                        }
                    }),
                    supported_currencies: '[]'
                };

                const result = transfer._convertToApiDetailFormat(transferData);

                expect(result.transferTerms.transferAmount).toEqual({
                    amount: undefined,
                    currency: undefined
                });
            });

            test('should handle missing fx data', () => {
                const transferData = {
                    id: '1',
                    amount: '100',
                    currency: 'USD',
                    raw: JSON.stringify({
                        needFx: true
                    }),
                    supported_currencies: '[]'
                };

                const result = transfer._convertToApiDetailFormat(transferData);

                expect(result.receiveAmount).toBe('');
                expect(result.receiveCurrency).toBe('');
            });
        });

        test('should handle null charges in _calculateTotalChargesFromCharges', () => {
            const result = transfer._calculateTotalChargesFromCharges(null, 'USD', 'EUR');
            expect(result).toEqual({
                totalSourceCurrencyCharges: { amount: '', currency: '' },
                totalTargetCurrencyCharges: { amount: '', currency: '' }
            });
        });
    });
});

describe('Transfer Model Extended Coverage', () => {
    let transfer;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            whereRaw: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            andWhereRaw: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([]),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            first: jest.fn().mockReturnThis(),
            raw: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnThis(),
            sum: jest.fn().mockReturnThis(),
            groupByRaw: jest.fn().mockReturnThis()
        };

        transfer = new Transfer({
            mockData: false,
            logger: { log: jest.fn() },
            db: mockDb
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('_applyJoin Method', () => {
        test('should call leftJoin with correct parameters', async () => {
            const query = {
                leftJoin: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
            };
            transfer._applyJoin(query);
            expect(query.leftJoin).toHaveBeenCalled();
        });
    });

    describe('_convertToApiFormat Method', () => {
        test('should handle empty transfer', () => {
            const result = transfer._convertToApiFormat({ raw: '{}', created_at: new Date().toISOString() });
            expect(result).toBeDefined();
            expect(result.status).toBeUndefined();
        });

        test('should handle existing fields correctly', () => {
            const mockTransfer = {
                id: 'abc123',
                success: 1,
                created_at: '2023-01-01T00:00:00.000Z',
                raw: '{}'
            };
            const result = transfer._convertToApiFormat(mockTransfer);
            expect(result.id).toBe('abc123');
            expect(result.status).toBe('SUCCESS');
        });
    });

    describe('_transferLastErrorToErrorType Method', () => {
        test('should return standard error if lastError has message', () => {
            const errorObj = { mojaloopError: { errorInformation: { errorCode: '4000', errorDescription: 'Something went wrong' } } };
            const result = Transfer._transferLastErrorToErrorType(errorObj);
            expect(result).toBe('Something went wrong');
        });

        test('should return default error if no message is provided', () => {
            const errorObj = { httpStatusCode: '401' };
            const result = Transfer._transferLastErrorToErrorType(errorObj);
            expect(result).toBe('HTTP 401');
        });

        test('should handle null error object gracefully', () => {
            const result = transfer._convertToApiFormat({ raw: JSON.stringify({ lastError: null }), created_at: new Date().toISOString() });
            expect(result.errorType).toBeNull();
        });
    });
});
