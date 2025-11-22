import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-transaction-id'),
}));

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockLogger = {
      log: jest.fn(),
    };
    (interceptor as any).logger = mockLogger;
  });

  describe('intercept', () => {
    it('should log incoming request and outgoing response', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/test',
        body: { test: 'data' },
        get: jest.fn().mockReturnValue('test-user-agent'),
      };
      const mockResponse = {
        statusCode: 200,
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler = {
        handle: () => of({ success: true }),
      } as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
          expect(mockRequest.transactionId).toBe('test-transaction-id');
          expect(mockLogger.log).toHaveBeenCalledTimes(2);
          expect(mockLogger.log).toHaveBeenNthCalledWith(1, {
            message: 'Incoming Request',
            transactionId: 'test-transaction-id',
            method: 'POST',
            url: '/test',
            body: { test: 'data' },
            userAgent: 'test-user-agent',
          });
          expect(mockLogger.log).toHaveBeenNthCalledWith(2, {
            message: 'Outgoing Response',
            transactionId: 'test-transaction-id',
            method: 'POST',
            url: '/test',
            statusCode: 200,
            duration: expect.stringMatching(/\d+ms/),
          });
          done();
        },
      });
    });

    it('should handle request without body', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: undefined,
        get: jest.fn().mockReturnValue(''),
      };
      const mockResponse = {
        statusCode: 200,
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler = {
        handle: () => of({}),
      } as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.objectContaining({
              body: undefined,
            }),
          );
          done();
        },
      });
    });

    it('should sanitize body', (done) => {
      const mockRequest = {
        method: 'POST',
        url: '/test',
        body: { password: 'secret', email: 'test@test.com' },
        get: jest.fn().mockReturnValue(''),
      };
      const mockResponse = {
        statusCode: 201,
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler = {
        handle: () => of({}),
      } as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(mockLogger.log).toHaveBeenCalledWith(
            expect.objectContaining({
              body: { password: 'secret', email: 'test@test.com' },
            }),
          );
          done();
        },
      });
    });

    it('should calculate response duration', (done) => {
      const mockRequest = {
        method: 'GET',
        url: '/test',
        body: {},
        get: jest.fn().mockReturnValue(''),
      };
      const mockResponse = {
        statusCode: 200,
      };
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const mockHandler = {
        handle: () => of({}),
      } as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          const logCall = mockLogger.log.mock.calls.find(
            (call: any[]) => call[0].message === 'Outgoing Response',
          );
          expect(logCall).toBeDefined();
          expect(logCall[0].duration).toMatch(/\d+ms/);
          done();
        },
      });
    });
  });

  describe('sanitizeBody', () => {
    it('should return body as is if no sensitive fields', () => {
      const body = { test: 'data' };
      const result = (interceptor as any).sanitizeBody(body);
      expect(result).toEqual(body);
    });

    it('should return undefined if body is undefined', () => {
      const result = (interceptor as any).sanitizeBody(undefined);
      expect(result).toBeUndefined();
    });

    it('should return null if body is null', () => {
      const result = (interceptor as any).sanitizeBody(null);
      expect(result).toBeNull();
    });
  });
});

