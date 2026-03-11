/**
 * File Description:
 * Jest configuration for JS consumers in the API workspace.
 *
 * Purpose:
 * Define test roots, Node environment, and path alias mapping for API tests.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
