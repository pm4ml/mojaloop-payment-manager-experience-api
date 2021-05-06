/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Yevhen Kyriukha - yevhen.kyriukha@modusbox.com                   *
 **************************************************************************/

/**
 * The error thrown when the given function isn't implemented.
 * @param [message] {String}
 */
function NotImplementedError(message) {
    const sender = (new Error)
        .stack
        .split('\n')[2]
        .replace(' at ','');

    this.message = `The method ${sender} isn't implemented.`;

    // Append the message if given.
    if (message)
        this.message += ` Message: "${message}".`;

    let str = this.message;

    while (str.indexOf('  ') > -1) {
        str = str.replace('  ', ' ');
    }

    this.message = str;
}

module.exports = {
    NotImplementedError,
};
