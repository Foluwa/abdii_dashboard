/**
 * Jest setup file
 */

import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href }: { children: ReactNode; href: string }) => {
    return React.createElement('a', { href }, children);
  };
});

// Mock next/image
jest.mock('next/image', () => {
  const React = require('react');
  return ({ alt, ...props }: { alt?: string } & Record<string, unknown>) => {
    return React.createElement('img', { alt: alt ?? '', ...props });
  };
});

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
