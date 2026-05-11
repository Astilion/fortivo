export class ServiceError extends Error {
  userMessage: string;
  originalError?: unknown;

  constructor(userMessage: string, originalError?: unknown) {
    super(userMessage);
    this.name = 'ServiceError';
    this.userMessage = userMessage;
    this.originalError = originalError;
  }
}
