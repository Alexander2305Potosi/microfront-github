import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GithubProfilesComponent } from './github-profiles.component';

describe('GithubProfilesComponent', () => {
  let component: GithubProfilesComponent;
  let fixture: ComponentFixture<GithubProfilesComponent>;

  beforeEach(async () => {
    // Mock global fetch for testing the API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([{ id: 1, login: 'testuser' }]),
      })
    ) as jest.Mock;

    await TestBed.configureTestingModule({
      imports: [GithubProfilesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GithubProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init and update signals', async () => {
    await component.ngOnInit();
    
    expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/users?per_page=15');
    expect(component.users().length).toBe(1);
    expect(component.users()[0].login).toBe('testuser');
    expect(component.loading()).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject('API Error')) as jest.Mock;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await component.ngOnInit();
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch github users', 'API Error');
    expect(component.loading()).toBe(false);
  });

  it('should handle filter term', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    component.handleFilter('angular');
    expect(consoleSpy).toHaveBeenCalledWith('Filtrando por:', 'angular');
  });
});
