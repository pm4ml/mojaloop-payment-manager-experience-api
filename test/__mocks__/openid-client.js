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

const Issuer = {
    discover: jest.fn(() => {}),
};


const generators = {
    codeVerifier: jest.fn(() => {}),
    codeChallenge: jest.fn(() => {}),
};


module.exports = {
    Issuer,
    generators,
};
