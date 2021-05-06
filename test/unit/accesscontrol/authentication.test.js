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

jest.mock('openid-client');

const oidcClient = require('openid-client');
const { Logger } = require('@mojaloop/sdk-standard-components');
const { createAuthenticatorMiddleware } = require('@internal/accesscontrol');
const rolePermissionMap = require('../../../src/rolePermissionMap.json');

const authConfig = {
    authDiscoveryEndpoint: 'authDiscoveryEndpoint',
    clientId: '123456',
    clientSecret: 'abcdef',
    redirectUri: 'http://1.2.3.4',
    rolePermissionMap,
};


let logger;
let mockIssuer;

describe('Authentication library', () => {
    beforeEach(() => {
        logger = new Logger.Logger({ context: { app: 'cookie-store-unit-tests'},
            stringify: () => {}});

        mockIssuer = {
            issuer: 'testissuer',
            metadata: 'metadata',
            Client: jest.fn(() => {}),
        };

        oidcClient.Issuer.discover = jest.fn(() => Promise.resolve(mockIssuer));
    });

    afterEach(() => {

    });

    test('Creates koa middleware', async () => {
        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        // we should get a function
        expect(typeof(middleware)).toBe('function');

        // discover should return an object after one call
        expect(oidcClient.Issuer.discover).toHaveBeenCalledTimes(1);

        // discover should be called with the auth discovery endpoint as its first arg
        expect(oidcClient.Issuer.discover.mock.calls[0][0]).toEqual(authConfig.authDiscoveryEndpoint);

        // the issuer should be asked to provide a single new client
        expect(mockIssuer.Client).toHaveBeenCalledTimes(1);

        // the new client should be constructed with the correct arguments from authConfig...
        // ...and for 'code' verification response
        expect(mockIssuer.Client.mock.calls[0][0]).toEqual({
            client_id: authConfig.clientId,
            client_secret: authConfig.clientSecret,
            redirect_uris: [authConfig.redirectUri],
            response_types: ['code'],
        });
    });

    test('handles a GET /login request by setting the session up for callback and redirecting to auth URL', async () => {
        const codeVerifier = 'codeverifier123';
        oidcClient.generators.codeVerifier = jest.fn(() => codeVerifier);
        oidcClient.generators.codeChallenge = jest.fn(() => true);

        const authUrl = 'http://authorizationUrl.com';
        const loginRedirectUrl = 'http://redirect.test.com';

        const mockClient = jest.fn(() => { return { authorizationUrl: jest.fn(() => authUrl) }; });
        mockIssuer.Client = mockClient;

        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const ctx = {
            path: '/login',
            state: { logger },
            query: {
                redirect: loginRedirectUrl,
            },
            session: {},
            redirect: jest.fn(() => {}),
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling the login route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // check the context carries a redirect directive to where the auth client sent us
        expect(ctx.redirect.mock.calls[0][0]).toEqual(authUrl);

        // check the code verifier returned by the generator is set correctly on the session
        expect(ctx.session.codeVerifier).toEqual(codeVerifier);

        // check the requested post-login redirect url is set correctly on the session
        expect(ctx.session.loginRedirectUrl).toEqual(loginRedirectUrl);

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();
    });

    test('handles a GET /auth request (callback from oidc provider) correctly by setting tokens on the session and redirecting to previously set URL', async () => {
        const codeVerifier = 'codeverifier123';

        const claims = {
            claim: 'a claim',
            realm_access: {
                roles: Object.keys(rolePermissionMap.roles),
            },
        };

        const expectedPermissions = Object.keys(rolePermissionMap.roles).reduce((acc, val) => {
            return acc.concat(rolePermissionMap.roles[val]);
        }, []);

        const tokenSet = {
            someToken: 'sometoken',
            claims: jest.fn(() => claims),
        };

        const params = { a: 1, b: 2, c: 3 };
        const logoutUrl = 'http://end.session.url';
        const callbackParams = jest.fn(() => params);
        const callback = jest.fn(() => Promise.resolve(tokenSet));
        const endSessionUrl = jest.fn(() => logoutUrl);

        const mockClient = jest.fn(() => {
            return {
                callbackParams,
                callback,
                endSessionUrl,
            };
        });

        mockIssuer.Client = mockClient;

        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const loginRedirectUrl = 'http://login.redirect';

        const ctx = {
            req: {
                path: 'somepath',
                query: 'somequery',
                body: {
                    some: 'body',
                }
            },
            path: '/auth',
            state: { logger },
            session: {
                codeVerifier,
                loginRedirectUrl,
            },
            redirect: jest.fn(() => {}),
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling the login route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // the auth route should extract callback params from the request
        expect(callbackParams).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback.mock.calls[0][0]).toEqual(authConfig.redirectUri);
        expect(callback.mock.calls[0][1]).toEqual(params);
        expect(callback.mock.calls[0][2]).toEqual({ code_verifier: codeVerifier });

        // check the token set is stored correctly in the session
        expect(ctx.session.auth.tokenSet).toEqual(tokenSet);

        // check the claims are set correctly in the session
        expect(ctx.session.auth.claims).toEqual(claims);
        expect(tokenSet.claims).toHaveBeenCalledTimes(1);

        // check permissions are mapped correctly
        expect(ctx.session.auth.permissions).toEqual(expectedPermissions);

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();

        // make sure the logout url is stored correctly in the session
        expect(ctx.session.auth.logoutUrl).toEqual(logoutUrl);
        expect(endSessionUrl).toHaveBeenCalledTimes(1);
        expect(endSessionUrl.mock.calls[0][0]).toEqual({
            id_token_hint: tokenSet,
            post_logout_redirect_uri: authConfig.loggedInLandingUrl,
        });

        // check the context carries a redirect directive to where the auth client sent us
        expect(ctx.redirect.mock.calls[0][0]).toEqual(loginRedirectUrl);
    });

    test('Returns user info from the identity provider', async () => {
        const tokenSet = {
            access_token: 'accesstoken',
            expires_at: (new Date().getTime() / 1000) + 10,
        };

        const userInfo = {
            username: 'somebody@some.com',
        };

        const userInfoFunc = jest.fn(() => Promise.resolve(userInfo));

        const mockClient = jest.fn(() => {
            return {
                userinfo: userInfoFunc,
            };
        });

        mockIssuer.Client = mockClient;

        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const ctx = {
            path: '/userInfo',
            session: {
                auth: {
                    tokenSet,
                },
            },
            state: { logger },
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling the login route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // check the userinfo method on the client is called with the correct parameters
        expect(userInfoFunc).toHaveBeenCalledTimes(1);
        expect(userInfoFunc.mock.calls[0][0]).toEqual(tokenSet.access_token);

        // check the user info object is returned in the response body
        expect(ctx.body).toEqual(userInfo);

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();
    });

    test('Rejects unauthenticated userInfo requests', async () => {
        const tokenSet = {
            access_token: 'accesstoken',
            expires_at: (new Date().getTime() / 1000) - 10,
        };

        const userInfo = {
            username: 'somebody@some.com',
        };

        const userInfoFunc = jest.fn(() => Promise.resolve(userInfo));

        const mockClient = jest.fn(() => {
            return {
                userinfo: userInfoFunc,
            };
        });

        mockIssuer.Client = mockClient;

        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const ctx = {
            path: '/userInfo',
            session: {
                auth: {
                    tokenSet,
                },
            },
            state: { logger },
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling this route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // check the correct "unauthenticated" error code is set on the context
        expect(ctx.status).toEqual(401);

        // check the auth object is removed from the session
        expect(ctx.session.auth).toEqual(null);

        // check the request route handler is not called
        expect(userInfoFunc).not.toHaveBeenCalled();

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();
    });

    test('Rejects requests for non-auth related routes with expired tokens', async () => {
        const tokenSet = {
            access_token: 'accesstoken',
            expires_at: (new Date().getTime() / 1000) - 10,
        };

        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const ctx = {
            path: '/somepath',
            session: {
                auth: {
                    tokenSet,
                },
            },
            state: { logger },
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling this route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // check the correct "unauthenticated" error code is set on the context
        expect(ctx.status).toEqual(401);

        // check the auth object is removed from the session
        expect(ctx.session.auth).toEqual(null);

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();
    });

    test('Rejects requests for non-auth related routes with no tokens', async () => {
        const middleware = await createAuthenticatorMiddleware({
            oidcClient,
            authConfig,
            logger,
        });

        const ctx = {
            path: '/somepath',
            session: {
            },
            state: { logger },
        };

        const next = jest.fn(() => Promise.resolve());
        const result = await middleware(ctx, next);

        // handling this route should return nothing from the middleware...
        // it only does things to the context
        expect(result).toBeUndefined();

        // check the correct "unauthenticated" error code is set on the context
        expect(ctx.status).toEqual(401);

        // check the auth object is removed from the session
        expect(ctx.session.auth).toBeUndefined();

        // make sure no further handler chain is called
        expect(next).not.toHaveBeenCalled();
    });
});
