import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  @Input() type: 'info' | 'success' | 'warning' | 'danger' = 'info';
  @Input() title?: string;

  get containerClass(): string {
    switch (this.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/50 text-amber-400';
      case 'danger': return 'bg-red-500/10 border-red-500/50 text-red-400';
      default: return 'bg-blue-500/10 border-blue-500/50 text-blue-400';
    }
  }

  get iconClass(): string {
    switch (this.type) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'danger': return 'text-red-500';
      default: return 'text-blue-500';
    }
  }
}
