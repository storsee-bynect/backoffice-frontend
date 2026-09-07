import { Component, Input } from '@angular/core';

export interface PageCountItem {
  label: string;
  value: number | string;
}

@Component({
  selector: 'app-page-data-count',
  templateUrl: './page-data-count.component.html',
  styleUrl: './page-data-count.component.scss'
})
export class PageDataCountComponent {
  /** Preferred: fully dynamic labeled tiles */
  @Input() items: PageCountItem[] | null = null;

  /** Legacy fallback when `items` is not provided */
  @Input() totalCount: any;
  @Input() filteredCount: any;

  get displayItems(): PageCountItem[] {
    if (Array.isArray(this.items) && this.items.length) {
      return this.items;
    }
    return [
      { label: 'Total Records', value: this.totalCount ?? 0 },
      { label: 'Filtered Records', value: this.filteredCount ?? 0 },
    ];
  }
}
