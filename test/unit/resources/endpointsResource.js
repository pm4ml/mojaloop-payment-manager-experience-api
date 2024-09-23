'use strict';

module.exports = {
    uploadEgressEndpointContext: {
        'request': {
            'method': 'POST',
            'url': '/dfsp/endpoints/egress/ips',
            'body': {
                'value': {'address':'163.10.24.29/32','ports':['9900']}
            },
        },
        'state': {
            'conf': {
                'inboundPort': 3000,
                'mockData': false,
                'logIndent': 2,
                'managementEndpoint': 'localhost:9000',
                'dfspId': 'pm4mltest'
            },
        },
        'params': { },

        'response': {}

    },
    uploadIngressEndpointContext: {
        'request': {
            'method': 'POST',
            'url': '/dfsp/endpoints/ingress/ips',
            'body': {
                'value': {'address':'163.10.24.29/32','ports':['9900']}
            },
        },
        'state': {
            'conf': {
                'inboundPort': 3000,
                'mockData': false,
                'logIndent': 2,
                'managementEndpoint': 'localhost:9000',
                'dfspId': 'pm4mltest'
            },
        },
        'params': { },

        'response': {}

    },
    updateEgressEndpointContext: {
        'request': {
            'method': 'PUT',
            'url': '/dfsp/endpoints/egress/ips/9',
            'body': {
                'value': {
                    'address': '163.10.24.29/32',
                    'ports': [
                        '9900'
                    ]
                }
            },
            'header': {
            }
        },
        'response': {
            'header': {
                'vary': 'Origin',
                'access-control-allow-origin': 'http://localhost:8080'
            }
        },
        'state': {
            'conf': {
                'inboundPort': 3000,
                'mockData': false,
                'logIndent': 2,
                'managementEndpoint': 'localhost:9000',
                'dfspId': 'pm4mltest'
            },
        },
        'params': { 'epId': '9' }
    },
    updateIngressEndpointContext: {
        'request': {
            'method': 'PUT',
            'url': '/dfsp/endpoints/ingress/ips/1',
            'body': {
                'value': {
                    'address': '163.10.24.29/32',
                    'ports': [
                        '9900'
                    ]
                }
            },
            'header': {
            }
        },
        'response': {
            'header': {
                'vary': 'Origin',
                'access-control-allow-origin': 'http://localhost:8080'
            }
        },
        'state': {
            'conf': {
                'inboundPort': 3000,
                'mockData': false,
                'logIndent': 2,
                'managementEndpoint': 'localhost:9000',
                'dfspId': 'pm4mltest'
            },
        },
        'params': { 'epId': '1' }
    },
    deleteEndpointContext: {
        'state': {
            'conf': {
                'inboundPort': 3000,
                'mockData': false,
                'logIndent': 2,
                'managementEndpoint': 'localhost:9000',
                'dfspId': 'pm4mltest'
            },
        },
        'response': {},
        'params': { 'epId': '1' }
    },
    getMonetaryZones: {
        'request': {
            'method': 'GET',
            'url': '/monetaryZones'
        },
        'state': {
            'conf': {
                'managementEndpoint': 'localhost:9000',
            },
        },
        'response': {}

    },
    getDFSPsByMonetaryZone: {
        'request': {
            'method': 'GET',
            'url': '/monetaryZones'
        },
        'state': {
            'conf': {
                'managementEndpoint': 'localhost:9000',
            },
        },
        'params': { 'monetaryZoneId': 'EUR' },
        'response': {}

    },
    getMetricsContext: {
        request: {
            method: 'GET',
            utl: '/metrics'
        },
        state: {
            conf: {
                metricsEndpoint: 'localhost:9000',
            }
        },
        params: {
            metricName: 'mojaloop_connector_outbound_party_lookup_request_count'
        },
        query: {
            startTimestamp: '2020-11-16T14:11:00.371Z',
            endTimestamp: '2020-11-17T14:11:06.371Z',
            aggregateDurationSeconds: 600,
            resolutionSeconds: 600,
            metricType: undefined
        }
    },
    getFxTransfersContext: {
        request: {
            method: 'GET',
            utl: '/transfers'
        },
        state: {
            conf: {
                mockData: true,
            }
        },
        params: {},
        query: {}
    },
};
