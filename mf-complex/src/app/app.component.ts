import { Component } from '@angular/core';
import { ComplexDemoComponent } from './complex-demo/complex-demo.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ComplexDemoComponent],
  template: '<app-complex-demo></app-complex-demo>'
})
export class AppComponent {}
