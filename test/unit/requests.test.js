const nock = require('nock');
const { Requests } = require('../../src/lib/requests');

describe('Requests Class', () => {
    let requests;
    const logger = {
        push: jest.fn().mockReturnThis(),
        log: jest.fn(),
    };

    const config = {
        logger,
        endpoint: 'localhost:3000',
    };

    beforeEach(() => {
        requests = new Requests(config);
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('GET method', () => {
        it('should perform a GET request successfully', async () => {
            nock('http://localhost:3000')
                .get('/test')
                .query({ param: 'value' })
                .reply(200, { success: true });

            const response = await requests.get('/test', { param: 'value' });
            expect(response).toEqual({ success: true });
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Executing HTTP GET');
        });

        it('should handle errors gracefully', async () => {
            nock('http://localhost:3000')
                .get('/test')
                .reply(500);

            await expect(requests.get('/test')).rejects.toThrow();
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Error attempting HTTP GET');
        });
        it('should remove undefined query parameters before sending the request', async () => {
            const qs = { param1: 'value1', param2: undefined };
            nock('http://localhost:3000')
                .get('/test')
                .query({ param1: 'value1' })
                .reply(200, { success: true });
    
            const response = await requests.get('/test', qs);
            expect(response).toEqual({ success: true });
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Executing HTTP GET');
        });
    });

    describe('POST method', () => {
        it('should perform a POST request successfully', async () => {
            nock('http://localhost:3000')
                .post('/test')
                .reply(201, { success: true });

            const response = await requests.post('/test', { data: 'test' });
            expect(response).toEqual({ success: true });
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Executing HTTP POST');
        });

        it('should handle POST errors gracefully', async () => {
            nock('http://localhost:3000')
                .post('/test')
                .reply(500);

            await expect(requests.post('/test', { data: 'test' })).rejects.toThrow();
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Error attempting POST.');
        });
    });

    describe('PUT method', () => {
        it('should perform a PUT request successfully', async () => {
            nock('http://localhost:3000')
                .put('/test')
                .reply(200, { success: true });

            const response = await requests.put('/test', { data: 'updated' });
            expect(response).toEqual({ success: true });
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Executing HTTP PUT');
        });

        it('should handle PUT errors gracefully', async () => {
            nock('http://localhost:3000')
                .put('/test')
                .reply(500);

            await expect(requests.put('/test', { data: 'updated' })).rejects.toThrow();
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Error attempting HTTP PUT');
        });
    });

    describe('DELETE method', () => {
        it('should perform a DELETE request successfully', async () => {
            nock('http://localhost:3000')
                .delete('/test')
                .reply(204);

            const response = await requests.delete('/test');
            expect(response).toBeNull(); // 204 No Content
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Executing HTTP DELETE');
        });

        it('should handle DELETE errors gracefully', async () => {
            nock('http://localhost:3000')
                .delete('/test')
                .reply(500);

            await expect(requests.delete('/test')).rejects.toThrow();
            expect(logger.push).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalledWith('Error attempting HTTP DELETE');
        });
    });
});

