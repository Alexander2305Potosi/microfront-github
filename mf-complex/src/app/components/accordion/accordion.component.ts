import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AccordionItem {
  title: string;
  content: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accordion.component.html'
})
export class AccordionComponent {
  @Input() items: AccordionItem[] = [];

  toggleItem(index: number) {
    this.items[index].isOpen = !this.items[index].isOpen;
  }
}
