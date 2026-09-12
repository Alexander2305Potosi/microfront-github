import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'core-data-table',
  standalone: true,
  imports: [],
  templateUrl: './data-table.component.html',
})
export class CoreDataTableComponent {
  @Input() title: string = 'Data Table';
  @Input() subtitle?: string;
  @Input() columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'avatar' | 'badge' | 'link';
    filterType?: 'text' | 'number' | 'date';
    pattern?: string;
    patternError?: string;
  }> = [];

  private _data: any[] = [];
  @Input() set data(value: any[]) {
    this._data = value;
    this.filteredData = value;
  }
  get data() {
    return this._data;
  }

  @Input() enablePagination: boolean = false;

  @Output() onFilter = new EventEmitter<string>();

  filteredData: any[] = [];

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    if (!term) {
      this.filteredData = this.data;
    } else {
      this.filteredData = this.data.filter((item) => {
        return this.columns.some((col) => {
          const val = item[col.key];
          return val && String(val).toLowerCase().includes(term);
        });
      });
    }
    this.onFilter.emit(term);
  }
}
