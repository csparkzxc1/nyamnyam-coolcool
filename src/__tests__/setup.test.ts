// Sanity test. Verifies that jest itself + jest-expo preset are wired up.
// Will be removed once we have real component tests.
describe('jest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
