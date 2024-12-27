const { HTTPResponseError, buildUrl, throwOrJson } = require('../../src/lib/requests/common');
const util = require('util');


describe('Utility Functions', () => {
    describe('HTTPResponseError', () => {
        it('should initialize with a message and params', () => {
            const errorParams = { msg: 'Something went wrong', res: {} };
            const error = new HTTPResponseError(errorParams);

            expect(error.message).toBe('Something went wrong');
            expect(error.getData()).toEqual(errorParams);
        });

        it('should return correct string representation', () => {
            const errorParams = { msg: 'Something went wrong', res: {} };
            const error = new HTTPResponseError(errorParams);

            expect(error.toString()).toBe(util.inspect(errorParams));
        });

        it('should return correct JSON representation', () => {
            const errorParams = { msg: 'Something went wrong', res: {} };
            const error = new HTTPResponseError(errorParams);

            expect(error.toJSON()).toBe(JSON.stringify(errorParams));
        });
    });

    describe('buildUrl', () => {
        it('should build a URL correctly without leading or trailing slashes', () => {
            const result = buildUrl('path', 'to', 'resource');
            expect(result).toBe('path/to/resource');
        });

        it('should strip leading and trailing slashes', () => {
            const result = buildUrl('/path/', '/to/', '/resource');
            expect(result).toBe('path/to/resource');
        });

        it('should handle undefined arguments', () => {
            const result = buildUrl('path', undefined, 'resource');
            expect(result).toBe('path/resource');
        });

        it('should retain trailing slash if last argument ends with one', () => {
            const result = buildUrl('path', 'to', 'resource/');
            expect(result).toBe('path/to/resource/');
        });
    });

    describe('throwOrJson', () => {
        it('should return null for content-length 0 or statusCode 204', async () => {
            const res = { headers: { 'content-length': '0' }, statusCode: 204, data: 'data' };
            const result = await throwOrJson(res);

            expect(result).toBeNull();
        });

        it('should throw HTTPResponseError for non-2xx status codes', async () => {
            const res = { statusCode: 500, headers: { 'content-length': '100' }, data: 'data' };

            await expect(throwOrJson(res)).rejects.toThrow(HTTPResponseError);
            await expect(throwOrJson(res)).rejects.toThrow('Request returned non-success status code 500');
        });

        it('should return data for successful responses', async () => {
            const res = { statusCode: 200, headers: { 'content-length': '100' }, data: 'data' };
            const result = await throwOrJson(res);

            expect(result).toBe('data');
        });

        it('should return null for 204 status code with data null', async () => {
            const res = { statusCode: 204, headers: { 'content-length': '0' }, data: null };
            const result = await throwOrJson(res);

            expect(result).toBeNull();
        });
    });
});
