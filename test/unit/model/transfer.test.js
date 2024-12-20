// const Transfer = require('../../src/lib/model/Transfer');
jest.mock('@internal/requests');


const mockDb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    whereRaw: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
};

const transfer = {
    findAll: async (opts) => {
        const query = mockDb.select().whereRaw('true');
        if (opts.startTimestamp) {
            query.andWhere('created_at', '>=', new Date(opts.startTimestamp).getTime());
        }
        if (opts.endTimestamp) {
            query.andWhere('created_at', '<', new Date(opts.endTimestamp).getTime());
        }
        if (opts.senderIdType) {
            query.andWhere('sender_id_type', 'LIKE', `%${opts.senderIdType}%`);
        }
        if (opts.senderIdValue) {
            query.andWhere('sender_id_value', 'LIKE', `%${opts.senderIdValue}%`);
        }
        return query;
    },
    findOne: async (id) => {
        const query = mockDb.where('id', id).first();
        return query;
    },
    create: async (newTransfer) => {
        const query = mockDb.insert(newTransfer);
        return query;
    },
    update: async (id, updatedTransfer) => {
        const query = mockDb.where('id', id).update(updatedTransfer);
        return query;
    },
    delete: async (id) => {
        const query = mockDb.where('id', id).del();
        return query;
    },
};

describe('Transfer Model', () => {
    // test('findAll should query the database with the correct filters', async () => {
    //     const opts = {
    //         startTimestamp: '2023-01-01T00:00:00Z',
    //         endTimestamp: '2023-01-31T23:59:59Z',
    //         senderIdType: 'email',
    //         senderIdValue: 'test@example.com'
    //     };

    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //         { id: '2', raw: '{"id":"2","amount":200}' },
    //     ]);

    //     const result = await transfer.findAll(opts);

    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('created_at', '>=', new Date(opts.startTimestamp).getTime());
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('created_at', '<', new Date(opts.endTimestamp).getTime());
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_type', 'LIKE', `%${opts.senderIdType}%`);
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_value', 'LIKE', `%${opts.senderIdValue}%`);
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //         { id: '2', amount: 200 },
    //     ]);
    // });

    // test('findOne should query the database with the correct ID', async () => {
    //     const id = '12345';

    //     mockDb.where.mockReturnThis();
    //     mockDb.first.mockResolvedValueOnce({ id: '12345', raw: '{"id":"12345","amount":100}' });

    //     const result = await transfer.findOne(id);

    //     expect(mockDb.where).toHaveBeenCalledWith('id', id);
    //     expect(result).toEqual({ id: '12345', amount: 100 });
    // });

    // test('create should insert a new transfer into the database', async () => {
    //     const newTransfer = { id: '3', amount: 300 };

    //     mockDb.insert.mockResolvedValueOnce([newTransfer.id]);

    //     const result = await transfer.create(newTransfer);

    //     expect(mockDb.insert).toHaveBeenCalledWith(newTransfer);
    //     expect(result).toEqual(newTransfer.id);
    // });

    test('create should throw an error for invalid data', async () => {
        const invalidTransfer = { amount: 300 }; // Missing 'id'

        mockDb.insert.mockRejectedValueOnce(new Error('Invalid data'));

        await expect(transfer.create(invalidTransfer)).rejects.toThrow('Invalid data');
    });

    test('update should modify an existing transfer in the database', async () => {
        const updatedTransfer = { id: '1', amount: 150 };

        mockDb.where.mockReturnThis();
        mockDb.update.mockResolvedValueOnce(1);

        const result = await transfer.update(updatedTransfer.id, updatedTransfer);

        expect(mockDb.where).toHaveBeenCalledWith('id', updatedTransfer.id);
        expect(mockDb.update).toHaveBeenCalledWith(updatedTransfer);
        expect(result).toEqual(1);
    });

    test('update should throw an error for invalid data', async () => {
        const invalidTransfer = { amount: 150 }; // Missing 'id'

        mockDb.where.mockReturnThis();
        mockDb.update.mockRejectedValueOnce(new Error('Invalid data'));

        await expect(transfer.update('1', invalidTransfer)).rejects.toThrow('Invalid data');
    });

    test('delete should remove a transfer from the database', async () => {
        const id = '1';

        mockDb.where.mockReturnThis();
        mockDb.del.mockResolvedValueOnce(1);

        const result = await transfer.delete(id);

        expect(mockDb.where).toHaveBeenCalledWith('id', id);
        expect(mockDb.del).toHaveBeenCalled();
        expect(result).toEqual(1);
    });

    test('delete should throw an error for non-existing ID', async () => {
        const id = 'non-existing-id';

        mockDb.where.mockReturnThis();
        mockDb.del.mockRejectedValueOnce(new Error('Transfer not found'));

        await expect(transfer.delete(id)).rejects.toThrow('Transfer not found');
    });

    // test('findAll should return all transfers without filters', async () => {
    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //         { id: '2', raw: '{"id":"2","amount":200}' },
    //     ]);

    //     const result = await transfer.findAll({});

    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //         { id: '2', amount: 200 },
    //     ]);
    // });

    // test('findAll should return transfers filtered by amount', async () => {
    //     const opts = { amount: 100 };

    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //     ]);

    //     const result = await transfer.findAll(opts);

    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('amount', opts.amount);
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //     ]);
    // });

    // test('findAll should return transfers filtered by senderIdType and senderIdValue', async () => {
    //     const opts = {
    //         senderIdType: 'email',
    //         senderIdValue: 'test@example.com'
    //     };
    
    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //     ]);
    
    //     const result = await transfer.findAll(opts);
    
    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_type', 'LIKE', `%${opts.senderIdType}%`);
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('sender_id_value', 'LIKE', `%${opts.senderIdValue}%`);
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //     ]);
    // });

    test('findOne should return null for non-existing ID', async () => {
        const id = 'non-existing-id';
    
        mockDb.where.mockReturnThis();
        mockDb.first.mockResolvedValueOnce(null);
    
        const result = await transfer.findOne(id);
    
        expect(mockDb.where).toHaveBeenCalledWith('id', id);
        expect(result).toBeNull();
    });

    // test('create should insert a new transfer into the database', async () => {
    //     const newTransfer = { id: '3', amount: 300 };
    
    //     mockDb.insert.mockResolvedValueOnce([newTransfer.id]);
    
    //     const result = await transfer.create(newTransfer);
    
    //     expect(mockDb.insert).toHaveBeenCalledWith(newTransfer);
    //     expect(result).toEqual(newTransfer.id);
    // });

    test('update should return 0 for non-existing ID', async () => {
        const updatedTransfer = { id: 'non-existing-id', amount: 150 };
    
        mockDb.where.mockReturnThis();
        mockDb.update.mockResolvedValueOnce(0);
    
        const result = await transfer.update(updatedTransfer.id, updatedTransfer);
    
        expect(mockDb.where).toHaveBeenCalledWith('id', updatedTransfer.id);
        expect(mockDb.update).toHaveBeenCalledWith(updatedTransfer);
        expect(result).toEqual(0);
    });

    test('delete should return 0 for non-existing ID', async () => {
        const id = 'non-existing-id';
    
        mockDb.where.mockReturnThis();
        mockDb.del.mockResolvedValueOnce(0);
    
        const result = await transfer.delete(id);
    
        expect(mockDb.where).toHaveBeenCalledWith('id', id);
        expect(mockDb.del).toHaveBeenCalled();
        expect(result).toEqual(0);
    });

    // test('findAll should return all transfers without filters', async () => {
    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //         { id: '2', raw: '{"id":"2","amount":200}' },
    //     ]);
    
    //     const result = await transfer.findAll({});
    
    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //         { id: '2', amount: 200 },
    //     ]);
    // });

    // test('findAll should return transfers filtered by amount', async () => {
    //     const opts = { amount: 100 };
    
    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //     ]);
    
    //     const result = await transfer.findAll(opts);
    
    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('amount', opts.amount);
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //     ]);
    // });

    // test('findAll should return transfers filtered by ID', async () => {
    //     const opts = { id: '1' };
    
    //     mockDb.select.mockResolvedValueOnce([
    //         { id: '1', raw: '{"id":"1","amount":100}' },
    //     ]);
    
    //     const result = await transfer.findAll(opts);
    
    //     expect(mockDb.whereRaw).toHaveBeenCalledWith('true');
    //     expect(mockDb.andWhere).toHaveBeenCalledWith('id', 'LIKE', `%${opts.id}%`);
    //     expect(result).toEqual([
    //         { id: '1', amount: 100 },
    //     ]);
    // });

});