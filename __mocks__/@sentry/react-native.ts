export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const init = jest.fn();
export const wrap = jest.fn((component: unknown) => component);
export const reactNavigationIntegration = jest.fn(() => ({
  registerNavigationContainer: jest.fn(),
}));
