import { Component, Input } from '@angular/core';

@Component({
  selector: 'core-stat-card',
  standalone: true,
  imports: [],
  template: `
    <div
      class="relative group bg-gray-800 border border-gray-700 rounded-3xl p-6 overflow-hidden hover:border-blue-500/50 transition-colors duration-500 shadow-lg"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      ></div>

      <div class="relative z-10 flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">{{ label }}</h3>
        <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center ' + colorClass">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>

      <div class="relative z-10">
        <div class="flex items-baseline space-x-2">
          <h2 class="text-4xl font-black text-white tracking-tight">{{ value }}</h2>
          @if (trend) {
            <span
              [class]="'text-sm font-bold ' + (trend > 0 ? 'text-emerald-400' : 'text-red-400')"
            >
              {{ trend > 0 ? '+' : '' }}{{ trend }}%
            </span>
          }
        </div>
        @if (description) {
          <p class="text-sm text-gray-500 mt-2 font-medium">{{ description }}</p>
        }
      </div>
    </div>
  `,
})
export class CoreStatCardComponent {
  @Input() label: string = 'Statistic';
  @Input() value: string | number = '0';
  @Input() description?: string;
  @Input() trend?: number;
  @Input() colorClass: string = 'bg-blue-500/20 text-blue-400';
}
