// Global Jest setup. Runs once after the test environment is ready,
// before each test file executes.

// Stub AsyncStorage with the official in-memory mock so Zustand persist
// middleware works in unit tests without a native bridge. The package
// ships its own mock; jest.mock("module", factory) hooks it in.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

export {};
