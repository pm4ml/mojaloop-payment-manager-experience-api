const MetricsModel = require('../../../src/lib/model/MetricsModel');
const { Requests } = require('@internal/requests');

jest.mock('@internal/requests');

describe('MetricsModel', () => {
    let loggerMock;
    let metricsModel;

    beforeEach(() => {
        loggerMock = {
            push: jest.fn(() => loggerMock),
            log: jest.fn(),
        };

        Requests.mockImplementation(() => ({
            get: jest.fn(),
        }));

        metricsModel = new MetricsModel({
            logger: loggerMock,
            metricsEndpoint: 'http://example.com',
        });
    });

    test('should throw an error if metricName is not supplied', async () => {
        await expect(metricsModel.query({})).rejects.toThrow(
            'metricName must be supplied'
        );
    });

    test('should set default values for aggregateDurationSeconds, resolutionSeconds, startTimestamp, and endTimestamp', async () => {
        metricsModel._requests.get.mockResolvedValue({
            status: 'success',
            data: { result: [] },
        });

        const opts = { metricName: 'test_metric' };
        await metricsModel.query(opts);

        expect(opts.aggregateDurationSeconds).toBe(20);
        expect(opts.resolutionSeconds).toBe(20);
        expect(new Date(opts.startTimestamp)).toBeInstanceOf(Date);
        expect(new Date(opts.endTimestamp)).toBeInstanceOf(Date);
    });

    test('should form the correct query for metricType HIST_SIZE', async () => {
        metricsModel._requests.get.mockResolvedValue({
            status: 'success',
            data: { result: [] },
        });

        const opts = {
            metricName: 'test_metric',
            metricType: 'HIST_SIZE',
        };

        await metricsModel.query(opts);

        const expectedQuery = 'sum(rate(test_metric_sum[20s])) / sum(rate(test_metric_count[20s]))';

        expect(metricsModel._requests.get).toHaveBeenCalledWith(
            'api/v1/query_range',
            expect.objectContaining({ query: expectedQuery })
        );
    });

    test('should log and return error if Prometheus query fails', async () => {
        const errorResponse = {
            status: 'error',
            errorType: 'mock_error_type',
            error: 'mock_error_message',
        };

        metricsModel._requests.get.mockResolvedValue(errorResponse);

        const opts = { metricName: 'test_metric' };
        const result = await metricsModel.query(opts);

        expect(loggerMock.push).toHaveBeenCalledWith(errorResponse);
        expect(result.error).toEqual({
            errorType: 'mock_error_type',
            error: 'mock_error_message',
        });
    });

    test('should return parsed result data if Prometheus query succeeds', async () => {
        const mockResponse = {
            status: 'success',
            data: {
                result: [
                    {
                        values: [
                            [1697745600, '10.5'],
                            [1697749200, '20.3'],
                        ],
                    },
                ],
            },
        };

        metricsModel._requests.get.mockResolvedValue(mockResponse);

        const opts = { metricName: 'test_metric' };
        const result = await metricsModel.query(opts);

        expect(result.data).toEqual([
            { timestamp: 1697745600000, value: 10.5 },
            { timestamp: 1697749200000, value: 20.3 },
        ]);
    });

    test('should return empty data if Prometheus query returns no results', async () => {
        const mockResponse = {
            status: 'success',
            data: { result: [] },
        };

        metricsModel._requests.get.mockResolvedValue(mockResponse);

        const opts = { metricName: 'test_metric' };
        const result = await metricsModel.query(opts);

        expect(result.data).toEqual([]);
    });
});
