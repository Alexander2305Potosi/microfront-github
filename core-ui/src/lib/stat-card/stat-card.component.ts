import { Component, Input } from '@angular/core';

@Component({
  selector: 'core-stat-card',
  standalone: true,
  imports: [],
  templateUrl: './stat-card.component.html',
})
export class CoreStatCardComponent {
  @Input() label: string = 'Statistic';
  @Input() value: string | number = '0';
  @Input() description?: string;
  @Input() trend?: string | number;
  @Input() colorClass: string = 'bg-blue-500/20 text-blue-400';
}
