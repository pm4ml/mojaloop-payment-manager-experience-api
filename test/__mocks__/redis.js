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

const redisMock = require('redis-mock');

class RedisClient {
    __data = {};

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
    destroy(key, value) {
        delete this.data[key];
    }
    keys() {
        return Object.keys(this.data);
    }
}


module.exports = {
    createClient: () => new RedisClient(),
};
