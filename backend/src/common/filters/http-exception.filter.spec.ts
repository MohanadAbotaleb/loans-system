import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockLogger: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockLogger = {
      error: jest.fn(),
    };
    (filter as any).logger = mockLogger;
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        url: '/test',
      };
      const mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Test error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Internal error');
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        url: '/test',
      };
      const mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: '/test',
        message: 'Internal server error',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle exception with object response', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        url: '/test',
      };
      const mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: '/test',
        message: { message: 'Validation failed', errors: ['field1', 'field2'] },
      });
    });

    it('should log error stack for Error instances', () => {
      const exception = new Error('Test error');
      exception.stack = 'Error stack trace';
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const mockRequest = {
        url: '/test',
      };
      const mockHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as unknown as ArgumentsHost;

      filter.catch(exception, mockHost);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Request Failed',
        url: '/test',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error stack trace',
      });
    });
  });
});

