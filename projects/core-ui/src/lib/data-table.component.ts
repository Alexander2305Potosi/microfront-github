import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'core-data-table',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
      <!-- Toolbar -->
      <div
        class="p-6 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 class="text-xl font-bold text-white">{{ title }}</h2>
          @if (subtitle) {
            <p class="text-sm text-gray-400 mt-1">{{ subtitle }}</p>
          }
        </div>

        <div class="flex items-center space-x-3">
          <!-- Search/Filter input -->
          <div class="relative">
            <svg
              class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              (input)="onSearch($event)"
              class="pl-10 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <ng-content select="[toolbar-actions]"></ng-content>
        </div>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-gray-900/50 border-b border-gray-700 text-gray-300 text-sm font-semibold uppercase tracking-wider"
            >
              @for (col of columns; track col) {
                <th class="px-6 py-4">{{ col.label }}</th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700/50 bg-gray-800">
            @for (row of filteredData; track row) {
              <tr class="hover:bg-gray-750 transition-colors group">
                @for (col of columns; track col) {
                  <td class="px-6 py-4 whitespace-nowrap">
                    <!-- Dynamic Content based on column type -->
                    @if (col.type === 'avatar') {
                      <img
                        [src]="row[col.key]"
                        class="w-10 h-10 rounded-full ring-2 ring-gray-700 group-hover:ring-blue-500 transition-all"
                      />
                    }
                    @if (col.type === 'badge') {
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      >
                        {{ row[col.key] }}
                      </span>
                    }
                    @if (col.type === 'link') {
                      <a
                        [href]="row[col.key]"
                        target="_blank"
                        class="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Ver enlace &rarr;
                      </a>
                    }
                    @if (!col.type || col.type === 'text') {
                      <span class="text-gray-300 font-medium">{{ row[col.key] }}</span>
                    }
                  </td>
                }
              </tr>
            }

            @if (filteredData.length === 0) {
              <tr>
                <td [attr.colspan]="columns.length" class="px-6 py-12 text-center text-gray-400">
                  <svg
                    class="w-12 h-12 mx-auto text-gray-600 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  No se encontraron registros
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (enablePagination && filteredData.length > 0) {
        <div
          class="px-6 py-4 border-t border-gray-700 bg-gray-900/30 flex items-center justify-between"
        >
          <span class="text-sm text-gray-400">
            Mostrando <span class="font-medium text-gray-200">1</span> a
            <span class="font-medium text-gray-200">{{ filteredData.length }}</span> de
            <span class="font-medium text-gray-200">{{ data.length }}</span> resultados
          </span>
          <div class="flex space-x-2">
            <button
              class="px-3 py-1 rounded-md bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled
            >
              Anterior
            </button>
            <button
              class="px-3 py-1 rounded-md bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CoreDataTableComponent {
  @Input() title: string = 'Data Table';
  @Input() subtitle?: string;
  @Input() columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'avatar' | 'badge' | 'link';
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
