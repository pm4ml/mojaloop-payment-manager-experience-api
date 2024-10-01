/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 *       Nguni Phakela - nguni@izyane.com                                 *
 **************************************************************************/

'use strict';

// eslint-disable-next-line no-unused-vars
const redisMock = require('redis-mock');

class RedisClient {
    // __data = {};

    constructor (){
        this.__data = {};
    }
    get data() {
        return this.__data;
    }
    set data(data) {
        this.__data = data;
    }
    get(key) {
        return this.data[key];
    }
    set(key, value) {
        this.data[key] = value;
    }
    keys() {
        return Object.keys(this.data);
    }
}


module.exports = {
    createClient: () => new RedisClient(),
};
