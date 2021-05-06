/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

// const util = require('util');
const redis = require('redis');


/**
 * Abstraction over session state storage
 */
class CookieStore {
    constructor(conf) {
        this._conf = conf;
        this._logger = this._conf.logger;
        this._redisUrl = conf.redisUrl;
        this._connected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this._client = redis.createClient({
                url: this._redisUrl,
            });

            this._client.on('error', (e) => {
                this._logger.push(e).error('Redis client error');
                reject(e);
            });

            this._client.on('ready', () => {
                this._connected = true;
                resolve();
            });
        });
    }

    async get(key) { // , maxAge, { rolling, ctx }) {
        if(!this._connected) {
            throw new Error('CookieStore instance not connected to cache');
        }

        // this._logger.log(`session get ${key}`);
        return new Promise((resolve, reject) => {
            this._client.get(key, (err, sess) => {
                if(err) {
                    this._logger.push(err).error('Error getting key from redis');
                    return reject(err);
                }
                resolve(JSON.parse(sess));
            });
        });
    }

    async set(key, sess, maxAge) { // , { rolling, changed, ctx }) {
        if(!this._connected) {
            throw new Error('CookieStore instance not connected to cache');
        }

        // this._logger.log(`session set ${key}, ${util.inspect(sess)}`);
        return new Promise((resolve, reject) => {
            this._client.setex(key, maxAge, JSON.stringify(sess), (err) => {
                if(err) {
                    this._logger.push(err).error('Error setting key in redis');
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async destroy(key) { // , { ctx }) {
        if(!this._connected) {
            throw new Error('CookieStore instance not connected to cache');
        }

        // this._logger.log(`session destroy ${key}`);
        return new Promise((resolve, reject) => {
            this._client.del(key, (err) => {
                if(err) {
                    this.logger.push(err).error('Error deleting key from redis');
                    return reject(err);
                }
                resolve();
            });
        }); 
    }
}


module.exports = {
    CookieStore,
};
