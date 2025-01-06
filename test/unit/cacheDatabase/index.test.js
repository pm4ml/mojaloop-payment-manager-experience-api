const { syncDB } = require('../../../src/lib/cacheDatabase/index');

describe('syncDB', () => {
    let redisCache, db, logger;

    beforeEach(() => {
        redisCache = {
            keys: jest.fn(),
            get: jest.fn(),
        };
        db = {
            insert: jest.fn(),
        };
        logger = {
            push: jest.fn(() => logger),
            log: jest.fn(),
        };
    });

    
});
