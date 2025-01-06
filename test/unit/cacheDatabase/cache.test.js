const Cache = require('../../../src/lib/cacheDatabase/cache');
const redis = require('redis');
const loggerMock = {
    log: jest.fn(),
    push: jest.fn().mockReturnThis(),
};

jest.mock('redis', () => {
    const mockClient = {
        connect: jest.fn(),
        quit: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        on: jest.fn(),
    };

    return {
        createClient: jest.fn().mockReturnValue(mockClient),
    };
});

describe('Cache', () => {
    let cache;
    let mockClient;

    beforeEach(() => {
        mockClient = redis.createClient();
        cache = new Cache({ cacheUrl: 'redis://localhost:6379', logger: loggerMock });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect to the Redis server', async () => {
            await cache.connect();

            expect(mockClient.connect).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if already connected', async () => {
            await cache.connect();
            await expect(cache.connect()).rejects.toThrow('already connected');
        });

        it('should log error if connection fails', async () => {
            mockClient.connect.mockRejectedValue(new Error('Connection failed'));

            await expect(cache.connect()).rejects.toThrow('Connection failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client getting subscriber');
        });
    });

    describe('disconnect', () => {
        it('should disconnect from Redis', async () => {
            await cache.connect();
            await cache.disconnect();

            expect(mockClient.quit).toHaveBeenCalledTimes(1);
        });

        it('should not call quit if not connected', async () => {
            await cache.disconnect();

            expect(mockClient.quit).not.toHaveBeenCalled();
        });

        it('should log error if disconnect fails', async () => {
            mockClient.quit.mockRejectedValue(new Error('Quit failed'));

            await expect(cache.disconnect()).rejects.toThrow('Quit failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client quitting');
        });
    });

    describe('set', () => {
        it('should set a string value in the cache', async () => {
            await cache.connect();
            await cache.set('key', 'value');

            expect(mockClient.set).toHaveBeenCalledWith('key', 'value');
        });

        it('should serialize an object to a string before setting it', async () => {
            const obj = { name: 'John' };
            await cache.connect();
            await cache.set('key', obj);

            expect(mockClient.set).toHaveBeenCalledWith('key', JSON.stringify(obj));
        });

        it('should handle non-stringifiable values gracefully', async () => {
            const circularObj = {};
            circularObj.ref = circularObj;

            await cache.connect();
            await expect(cache.set('key', circularObj)).rejects.toThrow('Converting circular structure to JSON');
        });

        it('should log errors when setting fails', async () => {
            mockClient.set.mockRejectedValue(new Error('Set failed'));

            await expect(cache.set('key', 'value')).rejects.toThrow('Set failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client setting key');
        });
    });

    describe('get', () => {
        it('should get a value from the cache', async () => {
            mockClient.get.mockResolvedValue('value');
            await cache.connect();
            const result = await cache.get('key');

            expect(mockClient.get).toHaveBeenCalledWith('key');
            expect(result).toBe('value');
        });

        it('should return null if key does not exist', async () => {
            mockClient.get.mockResolvedValue(null);
            await cache.connect();
            const result = await cache.get('non-existing-key');

            expect(mockClient.get).toHaveBeenCalledWith('non-existing-key');
            expect(result).toBeNull();
        });

        it('should log errors when get fails', async () => {
            mockClient.get.mockRejectedValue(new Error('Get failed'));

            await expect(cache.get('key')).rejects.toThrow('Get failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client getting key');
        });
    });

    describe('del', () => {
        it('should delete a key from the cache', async () => {
            await cache.connect();
            await cache.del('key');

            expect(mockClient.del).toHaveBeenCalledWith('key');
        });

        it('should log errors when del fails', async () => {
            mockClient.del.mockRejectedValue(new Error('Delete failed'));

            await expect(cache.del('key')).rejects.toThrow('Delete failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client deleting key');
        });
    });

    describe('keys', () => {
        it('should get keys from the cache based on a pattern', async () => {
            mockClient.keys.mockResolvedValue(['key1', 'key2']);
            await cache.connect();
            const result = await cache.keys('key*');

            expect(mockClient.keys).toHaveBeenCalledWith('key*');
            expect(result).toEqual(['key1', 'key2']);
        });

        it('should return an empty array if no keys match the pattern', async () => {
            mockClient.keys.mockResolvedValue([]);
            await cache.connect();
            const result = await cache.keys('no-match-pattern');

            expect(mockClient.keys).toHaveBeenCalledWith('no-match-pattern');
            expect(result).toEqual([]);
        });

        it('should log errors when keys retrieval fails', async () => {
            mockClient.keys.mockRejectedValue(new Error('Keys retrieval failed'));

            await expect(cache.keys('key*')).rejects.toThrow('Keys retrieval failed');
            expect(loggerMock.log).toHaveBeenCalledWith('Error from REDIS client getting keys');
        });
    });
});
