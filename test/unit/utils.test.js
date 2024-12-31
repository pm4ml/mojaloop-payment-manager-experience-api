const { NotImplementedError } = require('../../src/lib/utils/utils.js');

describe('NotImplementedError', () => {
    it('should create a NotImplementedError with default message', () => {
        const error = new NotImplementedError();
        expect(error.message).toMatch(/The method .* isn't implemented\./);
    });

    it('should append a custom message if provided', () => {
        const error = new NotImplementedError('Custom error message');
        expect(error.message).toMatch(/The method .* isn't implemented. Message: "Custom error message"\./);
    });

    it('should not have extra spaces in the message', () => {
        const error = new NotImplementedError('This  message has  extra spaces');
        expect(error.message).not.toContain('  ');
        expect(error.message).toMatch(/The method .* isn't implemented. Message: "This message has extra spaces"\./);
    });

    it('should maintain the stack trace format', () => {
        const error = new NotImplementedError();
        const methodPattern = /The method (.*?) isn't implemented\./;
        expect(error.message).toMatch(methodPattern);
        expect(error.message).not.toContain('  ');
    });
});


