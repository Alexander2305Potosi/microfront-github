import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoreUi } from './core-ui';

describe('CoreUi', () => {
  let component: CoreUi;
  let fixture: ComponentFixture<CoreUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreUi]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CoreUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
