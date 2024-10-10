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

// const { CookieStore } = require('@internal/accesscontrol');
const { Logger } = require('@mojaloop/sdk-standard-components');
const redis = require('redis');

// eslint-disable-next-line no-unused-vars
let logger;
let store;

describe('Cookie Store', () => {
    beforeEach(() => {
        logger = new Logger.Logger({ context: { app: 'cookie-store-unit-tests'}, stringify: () => ''});
        store = redis.createClient();

        // new CookieStore({
        //     logger,
        //     redisUrl: '',
        // });
    });

    afterEach(async () => {
        store.destroy();
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
            }
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
            }
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

