import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoreDataTableComponent } from './data-table.component';

describe('CoreDataTableComponent', () => {
  let component: CoreDataTableComponent;
  let fixture: ComponentFixture<CoreDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreDataTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CoreDataTableComponent);
    component = fixture.componentInstance;
  });

  it('should create the table component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct title', () => {
    component.title = 'Test Title';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Test Title');
  });

  it('should filter data correctly based on search term', () => {
    component.columns = [{ key: 'name', label: 'Name' }];
    component.data = [
      { name: 'Angular' },
      { name: 'React' },
      { name: 'Vue' }
    ];
    
    // Simulate user typing "ang"
    const inputEvent = { target: { value: 'ang' } } as unknown as Event;
    component.onSearch(inputEvent);

    expect(component.filteredData.length).toBe(1);
    expect(component.filteredData[0].name).toBe('Angular');
  });
});
