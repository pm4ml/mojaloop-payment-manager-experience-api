/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

const faker = require('faker');

const currencies = ['USD', 'EUR', 'MAD', 'XOF'];

const fakeAmount = () => (faker.random.number({ min: 10, max: 1e6 }) / 1e2).toFixed(2);

module.exports = {
    currencies,
    fakeAmount,
};
