import { Component } from '@angular/core';
import { CoreDataTableComponent, CoreStatCardComponent } from 'core-ui';

@Component({
  selector: 'app-complex-demo',
  standalone: true,
  imports: [CoreDataTableComponent, CoreStatCardComponent],
  templateUrl: './complex-demo.component.html'
})
export class ComplexDemoComponent {
  demoColumns = [
    { key: 'feature', label: 'Característica', type: 'text' as const },
    { key: 'status', label: 'Estado', type: 'badge' as const }
  ];

  demoData = [
    { feature: 'Module Federation (Microfrontends)', status: 'Activo' },
    { feature: 'Angular v18+ Zoneless', status: 'Activo' },
    { feature: 'Componentes Compartidos (core-ui)', status: 'Inyectado' },
    { feature: 'Jest Unit Testing con 100% Cobertura', status: 'Pasando' },
    { feature: 'Separación HTML y TS (SoC)', status: 'Completado' }
  ];
}
