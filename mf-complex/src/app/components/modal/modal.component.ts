import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Atención';
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() showSearch: boolean = false;
  @Input() confirmDisabled: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  searchQuery: string = '';

  get iconClass(): string {
    switch (this.type) {
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'danger': return 'text-red-500 bg-red-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  }

  get buttonClass(): string {
    switch (this.type) {
      case 'warning': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'danger': return 'bg-red-600 hover:bg-red-500 text-white';
      default: return 'bg-blue-600 hover:bg-blue-500 text-white';
    }
  }

  onClose() {
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit(this.searchQuery);
    this.searchQuery = '';
  }
}
