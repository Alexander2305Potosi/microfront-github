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
    { key: 'date', label: 'Fecha Tx', filterType: 'date-range' as const },
    { key: 'user', label: 'Usuario', filterType: 'text' as const },
    { key: 'amount', label: 'Monto ($)', filterType: 'number' as const },
    { 
      key: 'status', 
      label: 'Estado', 
      type: 'badge' as const,
      filterType: 'multiselect' as const,
      filterOptions: [
        { label: 'Completado', value: 'Completado' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Rechazado', value: 'Rechazado' }
      ]
    }
  ];
  originalData1 = [
    { id: 'TRX-901', date: '2024-03-01', user: 'Alex P.', amount: 4500.00, status: 'Completado' },
    { id: 'TRX-902', date: '2024-03-05', user: 'Sarah J.', amount: 120.50, status: 'Pendiente' },
    { id: 'TRX-903', date: '2024-03-10', user: 'Mike R.', amount: 8900.25, status: 'Rechazado' },
    { id: 'TRX-904', date: '2024-03-15', user: 'Emma W.', amount: 340.00, status: 'Completado' },
  ];
  tableData1 = [...this.originalData1];

  // Table 2: Products
  tableColumns2 = [
    { key: 'sku', label: 'SKU', pattern: '^ITM-[0-9]{3}$', patternError: 'El formato debe ser ITM-000' },
    { key: 'added_date', label: 'Fecha Ingreso', filterType: 'date' as const },
    { key: 'product', label: 'Producto', filterType: 'text' as const },
    { 
      key: 'category', 
      label: 'Categoría', 
      filterType: 'select' as const,
      filterOptions: [
        { label: 'Laptops', value: 'Laptops' },
        { label: 'Smartphones', value: 'Smartphones' },
        { label: 'Audio', value: 'Audio' }
      ]
    },
    { key: 'stock', label: 'Inventario', filterType: 'number' as const },
    { key: 'price', label: 'Precio', type: 'badge' as const }
  ];
  originalData2 = [
    { sku: 'ITM-001', added_date: '2023-12-01', product: 'MacBook Pro M3', category: 'Laptops', stock: 15, price: '$2400' },
    { sku: 'ITM-002', added_date: '2024-01-15', product: 'iPhone 15 Pro', category: 'Smartphones', stock: 42, price: '$999' },
    { sku: 'ITM-003', added_date: '2024-02-28', product: 'AirPods Max', category: 'Audio', stock: 0, price: '$549' }
  ];
  tableData2 = [...this.originalData2];

  // Advanced Search Modal State
  isSearchModalOpen = false;
  activeSearchTable: 1 | 2 = 1;
  searchFilters: Record<string, any> = {};
  hasFilter1 = false;
  hasFilter2 = false;

  // Custom Dropdown State
  dropdownOpen: Record<string, boolean> = {};
  dropdownSearch: Record<string, string> = {};

  get activeColumns() {
    return this.activeSearchTable === 1 ? this.tableColumns1 : this.tableColumns2;
  }

  openAdvancedSearch(tableNum: 1 | 2) {
    this.activeSearchTable = tableNum;
    this.searchFilters = {};
    this.dropdownOpen = {};
    this.dropdownSearch = {};
    this.isSearchModalOpen = true;
  }

  toggleDropdown(key: string) {
    this.dropdownOpen[key] = !this.dropdownOpen[key];
  }

  toggleSelection(key: string, value: any, isMulti: boolean) {
    if (isMulti) {
      if (!this.searchFilters[key]) this.searchFilters[key] = [];
      const idx = this.searchFilters[key].indexOf(value);
      if (idx > -1) {
        this.searchFilters[key].splice(idx, 1);
      } else {
        this.searchFilters[key].push(value);
      }
    } else {
      this.searchFilters[key] = value;
      this.dropdownOpen[key] = false; // close on select
    }
  }

  getFilteredOptions(col: any) {
    const search = this.dropdownSearch[col.key]?.toLowerCase() || '';
    if (!search) return col.filterOptions || [];
    return col.filterOptions.filter((opt: any) => opt.label.toLowerCase().includes(search));
  }

  getSelectedLabels(col: any): string {
    const val = this.searchFilters[col.key];
    if (col.filterType === 'multiselect') {
      if (!val || val.length === 0) return 'Seleccionar opciones...';
      return val.length + ' seleccionado(s)';
    } else {
      if (!val || val === 'null') return 'Todos';
      const opt = col.filterOptions.find((o: any) => o.value === val);
      return opt ? opt.label : 'Todos';
    }
  }

  onNumberKeydown(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  applyAdvancedSearch() {
    const filters = this.searchFilters;
    const isActive = Object.keys(filters).some(key => {
      const val = filters[key];
      if (Array.isArray(val)) return val.length > 0;
      return val !== null && val !== undefined && String(val).trim() !== '' && String(val) !== 'null';
    });

    const columns = this.activeColumns;
    
    const filterFn = (item: any) => {
      return columns.every(col => {
        if (col.filterType === 'date-range') {
          const start = filters[col.key + '_start'];
          const end = filters[col.key + '_end'];
          const itemDate = new Date(item[col.key]).getTime();
          
          if (start && itemDate < new Date(start).getTime()) return false;
          if (end && itemDate > new Date(end).getTime()) return false;
          return true;
        }

        const filterVal = filters[col.key];

        if (col.filterType === 'multiselect') {
          if (!filterVal || !Array.isArray(filterVal) || filterVal.length === 0) return true;
          return filterVal.includes(item[col.key]);
        }

        if (col.filterType === 'select') {
          if (!filterVal || filterVal === 'null') return true;
          return String(item[col.key]) === String(filterVal);
        }

        if (!filterVal) return true;

        if (col.filterType === 'date') {
          return item[col.key] === filterVal;
        }

        return String(item[col.key]).toLowerCase().includes(String(filterVal).toLowerCase());
      });
    };

    if (this.activeSearchTable === 1) {
      this.hasFilter1 = isActive;
      this.tableData1 = this.originalData1.filter(filterFn);
    } else {
      this.hasFilter2 = isActive;
      this.tableData2 = this.originalData2.filter(filterFn);
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
  modalTitle = '';
  modalMessage1 = '';
  modalMessage2 = '';

  openActionModal(action: 'sync' | 'delete') {
    if (action === 'delete') {
      this.modalType = 'danger';
      this.modalTitle = 'Acción Peligrosa';
      this.modalMessage1 = '¡Cuidado! Estás a punto de ejecutar una operación destructiva.';
      this.modalMessage2 = 'Esta acción no se puede deshacer. Todos los datos asociados a este registro serán eliminados permanentemente del servidor.';
    } else {
      this.modalType = 'warning';
      this.modalTitle = 'Modificar Ajustes Core';
      this.modalMessage1 = 'Estás a punto de alterar la configuración global del ecosistema.';
      this.modalMessage2 = 'Si procedes, todos los Microfrontends podrían perder la sesión actual y ser recargados.';
    }
    this.isModalOpen = true;
  }

  onModalConfirm(query?: string) {
    this.isModalOpen = false;
  }
}
