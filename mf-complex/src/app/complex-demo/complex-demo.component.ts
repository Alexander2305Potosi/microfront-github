import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreDataTableComponent, CoreStatCardComponent } from 'core-ui';
import { ModalComponent } from '../components/modal/modal.component';
import { AlertComponent } from '../components/alert/alert.component';
import { AccordionComponent, AccordionItem } from '../components/accordion/accordion.component';

@Component({
  selector: 'app-complex-demo',
  standalone: true,
  imports: [
    CommonModule,
    CoreDataTableComponent, 
    CoreStatCardComponent,
    ModalComponent,
    AlertComponent,
    AccordionComponent
  ],
  templateUrl: './complex-demo.component.html'
})
export class ComplexDemoComponent {
  isModalOpen = false;
  modalType: 'info' | 'warning' | 'danger' = 'warning';
  
  accordionItems: AccordionItem[] = [
    {
      title: '¿Qué es este Microfrontend?',
      content: 'Este módulo demuestra la capacidad de integrar múltiples componentes complejos, tanto de la librería core-ui como propios, en una sola vista coherente y con alta interactividad.'
    },
    {
      title: 'Rendimiento y Carga Perezosa',
      content: 'Module Federation permite que esta vista cargue componentes pesados sin afectar al Host. Los estilos Tailwind se compilan modularmente.'
    },
    {
      title: 'Seguridad y Aislamiento',
      content: 'Los modales y alertas en este MF operan en su propio contexto de Angular, previniendo conflictos de dependencias con otras vistas.'
    }
  ];

  tableData = [
    { id: 'TRX-901', user: 'Alex P.', amount: 4500.00, status: 'Completado' },
    { id: 'TRX-902', user: 'Sarah J.', amount: 120.50, status: 'Pendiente' },
    { id: 'TRX-903', user: 'Mike R.', amount: 8900.25, status: 'Rechazado' },
    { id: 'TRX-904', user: 'Emma W.', amount: 340.00, status: 'Completado' },
  ];

  tableColumns = [
    { key: 'id', label: 'ID Transacción' },
    { key: 'user', label: 'Usuario' },
    { key: 'amount', label: 'Monto ($)' },
    { key: 'status', label: 'Estado' }
  ];

  openModal() {
    this.modalType = 'warning';
    this.isModalOpen = true;
  }

  openDangerModal() {
    this.modalType = 'danger';
    this.isModalOpen = true;
  }

  onModalConfirm(searchQuery: string) {
    console.log('Modal confirmado con query:', searchQuery);
    this.isModalOpen = false;
  }
}
