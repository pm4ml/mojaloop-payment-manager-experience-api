const Cache = require('../../../src/lib/cacheDatabase/cache');
const redis = require('redis');
const loggerMock = {
    log: jest.fn(),
    push: jest.fn().mockReturnThis(),
};

jest.mock('redis', () => {
    const mockRedisClient = {
        connect: jest.fn(),
        quit: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        keys: jest.fn(),
        on: jest.fn(),
    };

    return {
        createClient: jest.fn().mockReturnValue(mockRedisClient),
    };
});

describe('Cache', () => {
    let cache;
    let mockRedisClient;

    beforeEach(() => {
        mockRedisClient = redis.createClient();
        cache = new Cache({ cacheUrl: 'redis://localhost:6379', logger: loggerMock });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('should connect to the Redis server', async () => {
            await cache.connect();

            expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if already connected', async () => {
            await cache.connect();
            await expect(cache.connect()).rejects.toThrow('already connected');
        });
    });

    describe('disconnect', () => {
        it('should disconnect from Redis', async () => {
            mockRedisClient.connect.mockResolvedValue();
            await cache.connect();
            await cache.disconnect();

            expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
        });

        it('should not call quit if not connected', async () => {
            await cache.disconnect();

            expect(mockRedisClient.quit).not.toHaveBeenCalled();
        });
    });

    describe('set', () => {
        it('should set a string value in the cache', async () => {
            await cache.connect();
            await cache.set('key', 'value');

            expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value');
        });

        it('should serialize an object to a string before setting it', async () => {
            const obj = { name: 'John' };
            await cache.connect();
            await cache.set('key', obj);

            expect(mockRedisClient.set).toHaveBeenCalledWith('key', JSON.stringify(obj));
        });

        it('should handle non-stringifiable values gracefully', async () => {
            const circularObj = {};
            circularObj.ref = circularObj;

            await cache.connect();
            await expect(cache.set('key', circularObj)).rejects.toThrow('Converting circular structure to JSON');
        });
    });

    describe('get', () => {
        it('should get a value from the cache', async () => {
            mockRedisClient.get.mockResolvedValue('value');
            await cache.connect();
            const result = await cache.get('key');

            expect(mockRedisClient.get).toHaveBeenCalledWith('key');
            expect(result).toBe('value');
        });

        it('should return null if key does not exist', async () => {
            mockRedisClient.get.mockResolvedValue(null);
            await cache.connect();
            const result = await cache.get('non-existing-key');

            expect(mockRedisClient.get).toHaveBeenCalledWith('non-existing-key');
            expect(result).toBeNull();
        });
    });

    describe('del', () => {
        it('should delete a key from the cache', async () => {
            await cache.connect();
            await cache.del('key');

            expect(mockRedisClient.del).toHaveBeenCalledWith('key');
        });
    });

    describe('keys', () => {
        it('should get keys from the cache based on a pattern', async () => {
            mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
            await cache.connect();
            const result = await cache.keys('key*');

            expect(mockRedisClient.keys).toHaveBeenCalledWith('key*');
            expect(result).toEqual(['key1', 'key2']);
        });

        it('should return an empty array if no keys match the pattern', async () => {
            mockRedisClient.keys.mockResolvedValue([]);
            await cache.connect();
            const result = await cache.keys('no-match-pattern');

            expect(mockRedisClient.keys).toHaveBeenCalledWith('no-match-pattern');
            expect(result).toEqual([]);
        });
    });
});
