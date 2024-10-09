/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                         *
 **************************************************************************/

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const { oas } = require('koa-oas3');
// const cors = require('@koa/cors');

// required for authentication and authorisation
const session = require('koa-session');
const oidcClient = require('openid-client');

const http = require('http');
const path = require('path');

const { Logger } = require('@mojaloop/sdk-standard-components');
const { CookieStore } = require('@internal/accesscontrol');

const handlers = require('./handlers');
const middlewares = require('./middlewares');

class Server {
    constructor(conf, db) {
        this._conf = conf;
        this._api = null;
        this._server = null;
        this._logger = null;
        this._db = db;

    }

    async setupApi() {
        this._api = new Koa();
        this._api.keys = this._conf.sessionConfig.sessionKeys;
        this._logger = await this._createLogger();

        let validator;
        try {
            validator = await oas({
                file: path.join(__dirname, 'api.yaml'),
                endpoint: '/openapi.json',
                uiEndpoint: '/',
            });
        } catch (e) {
            throw new Error('Error loading API spec. Please validate it with https://editor.swagger.io/');
        }

        this._api.use(async (ctx, next) => {
            ctx.state = {
                conf: this._conf,
                db: this._db,
            };
            await next();
        });

        this._conf.sessionConfig.store = new CookieStore({ logger: this._logger, redisUrl: this._conf.sessionConfig.redisUrl});

        await this._conf.sessionConfig.store.connect();

        this._api.use(session(this._conf.sessionConfig, this._api));

        // we need to allow cookies to be forwarded from other origins as this api may not
        // be served on the same port as the UI
        // moved this responsibility on Istio side
        // this._api.use(cors({ credentials: true }));

        this._api.use(middlewares.createErrorHandler());
        this._api.use(middlewares.createRequestIdGenerator());
        this._api.use(middlewares.createLogger(this._logger));
        this._api.use(bodyParser());
        if(this._conf.authConfig.enableAuthClient){
            this._api.use(await middlewares.createAuthenticator(oidcClient, this._conf.authConfig, this._logger));
        }
        this._api.use(validator);
        this._api.use(middlewares.createRouter(handlers));

        this._server = this._createServer();
        return this._server;
    }

    async start() {
        await new Promise((resolve) => this._server.listen(this._conf.inboundPort, resolve));
        this._logger.log(`Serving inbound API on port ${this._conf.inboundPort}`);

    }

    async stop() {
        if (!this._server) {
            return;
        }
        await new Promise(resolve => this._server.close(resolve));
        console.log('inbound shut down complete');
    }

    async _createLogger() {
        return new Logger.Logger({
            context: {
                app: 'mojaloop-payment-manager-experience-api'
            },
            stringify: Logger.buildStringify({ space: 2 }),
        });
    }

    _createServer() {
        return http.createServer(this._api.callback());
    }

}

module.exports = Server;
