import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComplexDemoComponent } from './complex-demo.component';
import { FormsModule } from '@angular/forms';

describe('ComplexDemoComponent', () => {
  let component: ComplexDemoComponent;
  let fixture: ComponentFixture<ComplexDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplexDemoComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ComplexDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the complex demo component', () => {
    expect(component).toBeTruthy();
  });

  it('should open advanced search modal with correct columns for projects table', () => {
    component.openAdvancedSearch(1);
    expect(component.isSearchModalOpen).toBe(true);
    expect(component.activeSearchTable).toBe(1);
    expect(component.activeColumns).toEqual(component.tableColumns1);
  });

  it('should properly validate numeric inputs by blocking invalid characters', () => {
    const mockEvent = new KeyboardEvent('keydown', { key: 'e' });
    const spyPrevent = jest.spyOn(mockEvent, 'preventDefault');
    
    component.onNumberKeydown(mockEvent);
    expect(spyPrevent).toHaveBeenCalled();
  });

  it('should close modal properly on apply search', () => {
    component.isSearchModalOpen = true;
    component.applyAdvancedSearch();
    expect(component.isSearchModalOpen).toBe(false);
  });
});
