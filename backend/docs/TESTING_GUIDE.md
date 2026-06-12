# Backend Testing Guide

## Commands

- Full tests: `npm test`
- Unit tests only: `npm run test:unit`
- Integration tests only: `npm run test:integration`
- Coverage report: `npm run test:coverage`

## Current test scope

- Unit tests
  - Enrollment service business rules
- Integration tests
  - Auth routes (validation, unauthorized, successful register mock)
  - Course authorization and payload validation

## Recommended CI pipeline order

1. `npm ci`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run test:coverage`
