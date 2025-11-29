/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Extend Jest matchers with custom types if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here if you create them
      // Example:
      // toBeAwesome(): R;
    }
  }
}

export {}
