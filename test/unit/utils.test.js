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
        const methodName = 'mockMethod';
        const error = new NotImplementedError();
        const expectedMessage = `The method ${methodName} isn't implemented.`;
        const actualMessage = error.message.replace(/The method .* isn't implemented\./, expectedMessage);

        expect(actualMessage).toContain(expectedMessage);
    });
});

