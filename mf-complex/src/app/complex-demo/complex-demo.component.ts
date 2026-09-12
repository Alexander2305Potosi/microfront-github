import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoreDataTableComponent, CoreStatCardComponent } from 'core-ui';
import { ModalComponent } from '../components/modal/modal.component';
import { AlertComponent } from '../components/alert/alert.component';
import { AccordionComponent, AccordionItem } from '../components/accordion/accordion.component';

@Component({
  selector: 'app-complex-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  modalType: 'info' | 'warning' | 'danger' = 'info';

  openModal() {
    this.modalType = 'warning';
    this.isModalOpen = true;
  }

  
  // Accordion
  accordionItems: AccordionItem[] = [
    { title: '¿Qué es este Microfrontend?', content: 'Módulo demostrativo con múltiples componentes de alta interactividad.' },
    { title: 'Tablas Dinámicas', content: 'core-ui renderiza cualquier cantidad de columnas sin modificar su código interno.' },
    { title: 'Búsqueda Avanzada', content: 'El modal lee dinámicamente las columnas de la tabla para generar los campos de filtro.' }
  ];

  // Table 1: Transactions
  tableColumns1 = [
    { key: 'id', label: 'Transacción', pattern: '^[A-Z]{3}-[0-9]{3}$', patternError: 'Debe ser en formato AAA-123' },
    { key: 'user', label: 'Usuario', filterType: 'text' as const },
    { key: 'amount', label: 'Monto ($)', filterType: 'number' as const },
    { key: 'status', label: 'Estado', type: 'badge' as const }
  ];
  originalData1 = [
    { id: 'TRX-901', user: 'Alex P.', amount: 4500.00, status: 'Completado' },
    { id: 'TRX-902', user: 'Sarah J.', amount: 120.50, status: 'Pendiente' },
    { id: 'TRX-903', user: 'Mike R.', amount: 8900.25, status: 'Rechazado' },
    { id: 'TRX-904', user: 'Emma W.', amount: 340.00, status: 'Completado' },
  ];
  tableData1 = [...this.originalData1];

  // Table 2: Products
  tableColumns2 = [
    { key: 'sku', label: 'SKU', pattern: '^ITM-[0-9]{3}$', patternError: 'El formato debe ser ITM-000' },
    { key: 'product', label: 'Producto', filterType: 'text' as const },
    { key: 'stock', label: 'Inventario', filterType: 'number' as const },
    { key: 'price', label: 'Precio', type: 'badge' as const }
  ];
  originalData2 = [
    { sku: 'ITM-001', product: 'MacBook Pro M3', stock: 15, price: '$2400' },
    { sku: 'ITM-002', product: 'iPhone 15 Pro', stock: 42, price: '$999' },
    { sku: 'ITM-003', product: 'AirPods Max', stock: 0, price: '$549' }
  ];
  tableData2 = [...this.originalData2];

  // Advanced Search Modal State
  isSearchModalOpen = false;
  activeSearchTable: 1 | 2 = 1;
  searchFilters: Record<string, string> = {};
  hasFilter1 = false;
  hasFilter2 = false;

  get activeColumns() {
    return this.activeSearchTable === 1 ? this.tableColumns1 : this.tableColumns2;
  }

  openAdvancedSearch(tableNum: 1 | 2) {
    this.activeSearchTable = tableNum;
    this.searchFilters = {};
    this.isSearchModalOpen = true;
  }

  applyAdvancedSearch() {
    const filters = this.searchFilters;
    const isActive = Object.values(filters).some(val => val && val.trim() !== '');
    
    if (this.activeSearchTable === 1) {
      this.hasFilter1 = isActive;
      this.tableData1 = this.originalData1.filter(item => {
        return Object.keys(filters).every(key => {
          if (!filters[key]) return true;
          return String((item as any)[key]).toLowerCase().includes(filters[key].toLowerCase());
        });
      });
    } else {
      this.hasFilter2 = isActive;
      this.tableData2 = this.originalData2.filter(item => {
        return Object.keys(filters).every(key => {
          if (!filters[key]) return true;
          return String((item as any)[key]).toLowerCase().includes(filters[key].toLowerCase());
        });
      });
    }
    
    this.isSearchModalOpen = false;
  }

  clearFilter(tableNum: 1 | 2) {
    if (tableNum === 1) {
      this.hasFilter1 = false;
      this.tableData1 = [...this.originalData1];
    } else {
      this.hasFilter2 = false;
      this.tableData2 = [...this.originalData2];
    }
  }

  // Generic Modals
  openDangerModal() {
    this.modalType = 'danger';
    this.isModalOpen = true;
  }

  onModalConfirm(query: string) {
    this.isModalOpen = false;
  }
}
