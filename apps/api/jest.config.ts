/**
 * File Description:
 * Typed Jest configuration for the API workspace.
 *
 * Purpose:
 * Provide strongly typed test runner settings and module alias mapping.
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

export default config;
