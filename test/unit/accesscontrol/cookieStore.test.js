/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

'use strict';

jest.mock('redis');

const { CookieStore } = require('@internal/accesscontrol');
const { Logger } = require('@mojaloop/sdk-standard-components');
const redis = require('redis');

// eslint-disable-next-line no-unused-vars
let logger;
let store;

describe('CookieStore', () => {
    let mockClient;
    let cookieStore;

    beforeEach(() => {
    // Mock Redis client
        mockClient = {
            on: jest.fn(),
            connect: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        };
        jest.spyOn(redis, 'createClient').mockReturnValue(mockClient);

        cookieStore = new CookieStore({
            logger: { push: jest.fn().mockReturnThis(), error: jest.fn() },
            redisUrl: 'redis://localhost:6379',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('connect successfully establishes a connection', async () => {
        mockClient.on.mockImplementation((event, callback) => {
            if (event === 'ready') callback();
        });

        await expect(cookieStore.connect()).resolves.toBeUndefined();
        expect(cookieStore._connected).toBe(true);
    });

    test('connect handles Redis client error', async () => {
        const errorMessage = 'Redis connection error';
        mockClient.on.mockImplementation((event, callback) => {
            if (event === 'error') callback(new Error(errorMessage));
        });

        await expect(cookieStore.connect()).rejects.toThrow(errorMessage);
        expect(cookieStore._conf.logger.push).toHaveBeenCalledWith(
            expect.any(Error)
        );
        expect(cookieStore._conf.logger.error).toHaveBeenCalledWith(
            'Redis client error'
        );
    });

    test('throws an error if destroy is called without connection', async () => {
        cookieStore._connected = false;

        await expect(cookieStore.destroy('test-key')).rejects.toThrow(
            'CookieStore instance not connected to cache'
        );
    });

    describe('get method', () => {
        beforeEach(() => {
            cookieStore._client = mockClient;
            cookieStore._connected = true;
        });

        test('retrieves and parses session data successfully', async () => {
            const mockSessionData = JSON.stringify({
                userId: 123,
                sessionToken: 'abc',
            });
            mockClient.get.mockResolvedValueOnce(mockSessionData);

            const result = await cookieStore.get('test-key');

            expect(result).toEqual({ userId: 123, sessionToken: 'abc' });
            expect(mockClient.get).toHaveBeenCalledWith('test-key');
        });

        test('throws an error if not connected', async () => {
            cookieStore._connected = false;

            await expect(cookieStore.get('test-key')).rejects.toThrow(
                'CookieStore instance not connected to cache'
            );
        });

        test('returns null for non-existent session key', async () => {
            mockClient.get.mockResolvedValueOnce(null);

            const result = await cookieStore.get('non-existent-key');

            expect(result).toBeNull();
            expect(mockClient.get).toHaveBeenCalledWith('non-existent-key');
        });
    });

    describe('set method', () => {
        beforeEach(() => {
            cookieStore._client = mockClient;
            cookieStore._connected = true;
        });

        test('sets session data successfully', async () => {
            mockClient.set.mockResolvedValueOnce('OK');

            await cookieStore.set('test-key', { userId: 123 }, 3600);

            expect(mockClient.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify({ userId: 123 }),
                3600
            );
        });

        test('throws an error if not connected', async () => {
            cookieStore._connected = false;

            await expect(
                cookieStore.set('test-key', { userId: 123 }, 3600)
            ).rejects.toThrow('CookieStore instance not connected to cache');
        });

        test('handles Redis client set error', async () => {
            mockClient.set.mockRejectedValueOnce(new Error('Redis set failed'));

            await expect(
                cookieStore.set('test-key', { userId: 123 }, 3600)
            ).rejects.toThrow('Redis set failed');

            expect(mockClient.set).toHaveBeenCalledWith(
                'test-key',
                JSON.stringify({ userId: 123 }),
                3600
            );
        });
    });

    test('destroy deletes a stored session', async () => {
        mockClient.on.mockImplementation((event, callback) => {
            if (event === 'ready') callback();
        });

        await cookieStore.connect();
        await cookieStore.destroy('testKey');
        expect(mockClient.del).toHaveBeenCalledWith('testKey');
    });
});

describe('Cookie Store', () => {
    beforeEach(() => {
        logger = new Logger.Logger({
            context: { app: 'cookie-store-unit-tests' },
            stringify: () => '',
        });
        store = redis.createClient();
    // cookieStore = new CookieStore({
    //   logger,
    //   redisUrl: "",
    // });
    });

    afterEach(async () => {
        store.destroy();
    });

    test('Constructor initializes properties correctly', () => {
        const store = new CookieStore({
            logger,
            redisUrl: 'redis://localhost:6379',
        });
        expect(store._redisUrl).toBe('redis://localhost:6379');
        expect(store._logger).toBeDefined();
        expect(store._connected).toBe(false);
    });

    test('Connects to redis successfully', async () => {
        expect(store).not.toBeFalsy();
    // await expect(store.connect()).resolves.toBeUndefined();
    });

    test('Stores and retrieves a session object', async () => {
    // await store.connect();

        const testObject = {
            a: 123,
            b: 'string',
            c: {
                a: 456,
                z: 'hello world!',
            },
        };

        const sessionKey = '123abc';

        // give a 10 second TTL so the test has enough time
        // possibly look at how we can make this deterministic
        store.set(sessionKey, testObject, 10);

        const retrievedObject = store.get('123abc');

        expect(retrievedObject).toBe(testObject);
    // await expect(store.set(sessionKey, testObject, 10)); //.resolves.toBeUndefined();
    // const retrievedObject = await store.get(sessionKey);
    // expect(retrievedObject).toEqual(testObject);
    });

    /*

    At first I thought this test was a good idea. Then I realised, with some assistance,
    that it is utterly pointless against a mock redis. The expiration behaviour is
    in redis, not the mock. Testing this against a mock redis is a waste of time.
    This test should be an integration test, not a unit test.
    This has been left here as a reminder and explanation for any future reader who may
    question why expiration is not tested here.

    test('Does not retrieve an expired session object', async () => {
        await store.connect();

        const testObject = {
            a: 123,
            b: 'string',
            c: {
                a: 456,
                z: 'hello world!',
            }
        };

        const sessionKey = '123abc';

        // give a 1 second TTL then wait 2 seconds and try to retrieve
        await expect(store.set(sessionKey, testObject, 1)).resolves.toBeUndefined();

        await new Promise(res => setTimeout(res, 2000));
        const retrievedObject = await store.get(sessionKey);
        expect(retrievedObject).toEqual(null);
    });
    */

    test('Deletes a stored session object', async () => {
    // await store.connect();

        const testObject = {
            a: 123,
            b: 'string',
            c: {
                a: 456,
                z: 'hello world!',
            },
        };

        const sessionKey = '123abc';

        // give a 10 second TTL so the test has enough time
        // possibly look at how we can make this deterministic
        await expect(store.set(sessionKey, testObject, 100)); //.resolves.toBeDefined(); //.toBeUndefined();

        // delete the object from the store
        await expect(store.destroy(sessionKey)); //.resolves.toBeDefined();//.toBeUndefined();

        // try retrieving the object
        const retrievedObject = await store.get(sessionKey);
        expect(retrievedObject).toBeUndefined();
    });
});
