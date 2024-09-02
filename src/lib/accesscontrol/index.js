/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/


const util = require('util');

// this does not really belong here. session management is a separate concern to
// authentication but as the initial implementation of this middleware uses the
// koa session middleware a redis session store is provided for convenience.
const { CookieStore } = require('./cookieStore.js');


/**
 * Returns a middleware function to handles routes relating to OIDC (openid connect)
 * authorization code flow which allows a client to obtain ID, access and refresh
 * tokens from an OIDC compliant issuer.
 *
 * See documentation here for more info on the openid-connect client. Google is your
 * friend for more info on the authorization flow implemented here. Note that this
 * is a "code" based flow. General info can be found here:
 * https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth
 *
 * @returns {function}
 */
const createAuthenticatorMiddleware = async (conf) => {
    const { oidcClient, authConfig, logger } = conf;
    const { Issuer, generators } = oidcClient;

    logger.push(authConfig).log('Auth config');

    let issuer;

    // block until we can contact the authentication service
    // no point continuing if we cant
    while(!issuer) {
        try {
            issuer = await Issuer.discover(authConfig.authDiscoveryEndpoint);
            logger.log(`Discovered auth issuer ${issuer.issuer}, ${util.inspect(issuer.metadata)}`);
        }
        catch(e) {
            logger.push(e).log('Error contacting authentication service. Retrying in 1 second');
            // wait a second before trying again
            await new Promise(res => setTimeout(res, 1000));
        }
    }

    const client = new issuer.Client({
        client_id: authConfig.clientId,
        client_secret: authConfig.clientSecret,
        redirect_uris: [authConfig.redirectUri],
        response_types: ['code'],
    });

    return authenticationRoutes(client, generators, authConfig);
};


/**
 * Returns a mini-router function that handles auth related routes
 *
 * @returns {function}
 */
const authenticationRoutes = (client, generators, authConfig) => {
    return async (ctx, next) => {
        if (ctx.path !== '/health') {
            ctx.state.logger.log('Authenticating request');
        }

        // TODO: refresh route
        switch(ctx.path) {
            case '/health':
                // always allow unauthorised health checks (to support k8s)
                return await next();
            case '/login':
                return await loginRouteHandler(ctx, next, client, generators, authConfig);
            case '/auth':
                return await authRouteHandler(ctx, next, client, authConfig);
            case '/logout':
                return await logoutRouteHandler(ctx);
            default:
                if(checkAuthentication(ctx)) {
                    // special case userInfo route handled here as we
                    // dont want to pass references to the auth client
                    // around this service
                    if(ctx.path === '/userInfo') {
                        return await userInfoRouteHandler(ctx, next, client);
                    }

                    // if authentication was ok, proceed with the handler chain
                    return await next();
                }
                // ...otherwise, just do nothing. koa will return any auth errors which were
                // set on the context.
        }
    };
};


/**
 * Redirects the client to the logout URL provided by the auth provider
 *
 * @returns {undefined}
 */
const logoutRouteHandler = (ctx) => {
    if(!ctx.session.auth.logoutUrl) {
        throw new Error('No logout URL stored in session');
    }

    const redirectTo = ctx.session.auth.logoutUrl;
    ctx.session.auth = null;
    ctx.redirect(redirectTo);
};


/**
 * Checks that an unexpired authentication token is in the session.
 * Otherwise sets the response to 401 Unauthorized and returns
 *
 * @returns {boolean}
 */
const checkAuthentication = (ctx) => {
    if(!ctx.session.auth || !ctx.session.auth.tokenSet
        || isNaN(ctx.session.auth.tokenSet.expires_at)) {
        // we must have authenticated to get past here
        ctx.state.logger.log('Rejecting unauthenticated request');
        ctx.status = 401;
        return false;
    }

    const nowSeconds = (new Date()).getTime() / 1000;

    if(ctx.session.auth.tokenSet.expires_at <= nowSeconds) {
        // the users tokens have expired
        ctx.state.logger.log('Rejecting request due to expired authentication.'
            + ` Tokens expired at ${ctx.session.auth.tokenSet.expires_at}`
            + ` current timestamp is ${nowSeconds}`);
        ctx.session.auth = null;
        ctx.status = 401;
        return false;
    }

    return true;
};


/**
 * Start the authentication dance with the oidc provider by asking it for an authorization
 * URL and redirecting the client to it.
 *
 * @returns {undefined}
 */
const loginRouteHandler = async (ctx, next, client, generators, authConfig) => {
    // our goal here is to start the first step of getting a token
    // we return the URL the browser must redirect to

    ctx.session.loginRedirectUrl = ctx.query.redirect;
    ctx.session.codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(ctx.session.codeVerifier);

    const authUrl = client.authorizationUrl({
        scope: `openid ${authConfig.scopes}`, // seems that 'openid' is required as a scope here for keycloak.
        resource: authConfig.resourceName,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    ctx.state.logger.log('Redirecting to auth URL in response to login request');
    ctx.redirect(authUrl);
};


/**
 * Handles a redirect from an OIDC provider after authorization has taken place.
 * Makes a callback to the OIDC provider with our code verifier in order to
 * validate the code/challenge.
 *
 * Upon successful authentication populates the session with token and claims returned
 * by the OIDC provider.
 *
 * Also maps our local fine grained permissions to matching roles the user has.
 *
 * @returns {undefined}
 */
const authRouteHandler = async (ctx, next, client, authConfig) => {
    // our browser client has got a redirect from the identity provider.
    // now we need to complete the process of getting a token

    // call authentication service with our callback token
    const params = client.callbackParams(ctx.req);

    let tokenSet;

    try {
        tokenSet = await client.callback(authConfig.redirectUri,
            params, { code_verifier: ctx.session.codeVerifier });
    }
    catch(e) {
        ctx.state.logger.push(e).log(`Error making callback to authentication service: ${e.stack || util.inspect(e)}`);
        ctx.status = 500;
        return;
    }

    const claims = tokenSet.claims();
    ctx.state.logger.push({ claims }).log('Token request to authentication service succeeded.'
        + ' Redirecting to logged in landing page.');

    // set token and claims in session state
    ctx.session.auth = {
        tokenSet,
        claims: claims,
    };

    // add roles and mapped permissions
    if(claims.realm_access && Array.isArray(claims.realm_access.roles)) {
        // if we got some roles, store them in a convenient place and map our fine grained
        // permissions to them
        ctx.session.auth.roles = claims.realm_access.roles;
        ctx.session.auth.permissions = claims.realm_access.roles.reduce((acc, cur) => {
            if(authConfig.rolePermissionMap.roles[cur]) {
                acc = acc.concat(authConfig.rolePermissionMap.roles[cur]);
            }
            return acc;
        }, []);
    }

    // store the logout url for the user in the session so we can call it when the user
    // requests to logout
    ctx.session.auth.logoutUrl = await client.endSessionUrl({
        id_token_hint: tokenSet,
        post_logout_redirect_uri: authConfig.loggedInLandingUrl,
    });

    // send redirect back to landing page or where our browser requested to
    // be redirected to
    let redirectTo = authConfig.loggedInLandingUrl;
    if(ctx.session.loginRedirectUrl) {
        redirectTo = ctx.session.loginRedirectUrl;
    }

    ctx.redirect(redirectTo);
};


/**
 * Calls the OIDC provider and asks for a user info object. This typically contains details
 * of the user such as name.
 *
 * @returns {undefined}
 */
const userInfoRouteHandler = async (ctx, next, client) => {
    // call the userinfo endpoing on the auth service to get more info on the user
    const userInfo = await client.userinfo(ctx.session.auth.tokenSet.access_token);
    ctx.state.logger.push(userInfo).log('Got user info from authentication service');
    ctx.body = userInfo;
};


//const createAuthorizerMiddleware = (conf) => {
//    return async function(ctx, next) {
//        await next();
//    };
//};


module.exports = {
    CookieStore,
    createAuthenticatorMiddleware,
    //createAuthorizerMiddleware,
};
