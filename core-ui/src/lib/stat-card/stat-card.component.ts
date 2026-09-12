import { Component, Input } from '@angular/core';

@Component({
  selector: 'core-stat-card',
  standalone: true,
  imports: [],
  templateUrl: './stat-card.component.html',
})
export class CoreStatCardComponent {
  @Input() label: string = 'Statistic';
  @Input() value!: string | number;
  @Input() description?: string;
  @Input() trend?: string | number;
  @Input() colorClass: string = 'bg-blue-500/20 text-blue-400';

  get isPositiveTrend(): boolean {
    if (typeof this.trend === 'number') return this.trend > 0;
    if (typeof this.trend === 'string') return this.trend.includes('+');
    return true;
  }

  get formattedTrend(): string {
    if (typeof this.trend === 'number') {
      return (this.trend > 0 ? '+' : '') + this.trend + '%';
    }
    return String(this.trend || '');
  }
}
