/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2020 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Damián García - damian.garcia@modusbox.com                       *
 **************************************************************************/

const { Requests } = require('@internal/requests');

class MonetaryZoneModel {
    /**
     *
     * @param props {object}
     * @param props.logger {object}
     * @param props.managementEndpoint {string}
     */
    constructor(props) {
        this._requests = new Requests({
            logger: props.logger,
            endpoint: props.managementEndpoint,
        });
    }

    /**
     * Returns the monetary zones supported
     */
    async getMonetaryZones() {
        return this._requests.get('monetaryzones');

    }

}

module.exports = MonetaryZoneModel;
