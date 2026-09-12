import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GithubProfilesComponent } from './github-profiles.component';

describe('GithubProfilesComponent', () => {
  let component: GithubProfilesComponent;
  let fixture: ComponentFixture<GithubProfilesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubProfilesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GithubProfilesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    // Flush initial request from ngOnInit
    const req = httpMock.expectOne('https://api.github.com/users?per_page=15');
    req.flush([]);
  });

  it('should load users on init and update signals', async () => {
    // The ngOnInit is called during detectChanges() and initiates the fetch.
    const req = httpMock.expectOne('https://api.github.com/users?per_page=15');
    expect(req.request.method).toBe('GET');
    
    // Resolve the promise by flushing the mock data
    req.flush([{ id: 1, login: 'testuser' }]);
    
    // Wait for the async macro-task (firstValueFrom) to resolve
    await fixture.whenStable();
    
    expect(component.users().length).toBe(1);
    expect(component.users()[0].login).toBe('testuser');
    expect(component.loading()).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const req = httpMock.expectOne('https://api.github.com/users?per_page=15');
    
    // Simulate an error
    req.error(new ProgressEvent('Network error'));
    
    // Wait for the async macro-task to resolve
    await fixture.whenStable();
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });

  it('should handle filter term', () => {
    const req = httpMock.expectOne('https://api.github.com/users?per_page=15');
    req.flush([]); // Clean up pending request
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    component.handleFilter('angular');
    expect(consoleSpy).toHaveBeenCalledWith('Filtrando por:', 'angular');
  });
});
