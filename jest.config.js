/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
// eslint-disable-next-line no-unused-vars
const path = require('path');

const config = {
    // Configure reporters for test results
    reporters: [
        'default',
        ['jest-junit', {outputDirectory: './test/results/', outputName: 'xunit.xml'}],
    ],
    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: 'v8',

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: [
        'json',
        'text',
        'lcov',
        'text-summary'
    ],

    // An object that configures minimum threshold enforcement for coverage results
    coverageThreshold: {
        global: {
            statements: 90,
            functions: 90,
            branches: 90,
            lines: 90
        }
    },

    // The test environment that will be used for testing
    testEnvironment: 'jest-environment-node',

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    transformIgnorePatterns: [
        '/node_modules/',
    // "\\.pnp\\.[^\\/]+$"
    ],

};

module.exports = config;
