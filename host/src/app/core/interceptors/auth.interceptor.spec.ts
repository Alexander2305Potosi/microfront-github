import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    
    // Clear localStorage before each test
    localStorage.clear();
    
    // Spy on crypto.randomUUID (since it might not exist in jsdom)
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn().mockReturnValue('mocked-uuid-1234')
      }
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add X-Request-ID and Authorization headers if token exists', () => {
    localStorage.setItem('msal_jwt_token', 'fake-jwt-token');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Request-ID')).toBe('mocked-uuid-1234');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
  });

  it('should only add X-Request-ID if token does not exist', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Request-ID')).toBe('mocked-uuid-1234');
    expect(req.request.headers.has('Authorization')).toBeFalsy();
  });
});
