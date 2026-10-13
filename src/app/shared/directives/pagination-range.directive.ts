import { AfterViewChecked, ContentChild, Directive, ElementRef, Renderer2 } from '@angular/core';
import { PaginationControlsComponent, PaginationService } from 'ngx-pagination';

@Directive({selector: '.main-pagination', standalone: true})
export class PaginationRangeDirective implements AfterViewChecked {
  @ContentChild(PaginationControlsComponent, {descendants: true}) controls?: PaginationControlsComponent;
  private label?: HTMLElement;
  private previous = '';
  constructor(private host: ElementRef<HTMLElement>, private renderer: Renderer2, private pagination: PaginationService) {}
  ngAfterViewChecked(): void {
    if (!this.controls) return;
    const instance = this.pagination.getInstance(this.controls.id);
    if (!instance) return;
    const total = Math.max(0, Number(instance.totalItems) || 0);
    const size = Math.max(1, Number(instance.itemsPerPage) || 10);
    const page = Math.max(1, Number(instance.currentPage) || 1);
    const start = total ? Math.min((page - 1) * size + 1, total) : 0;
    const end = total ? Math.min(page * size, total) : 0;
    const value = `${start}-${end} / ${total}`;
    if (!this.label) {
      this.label = this.renderer.createElement('span');
      this.renderer.addClass(this.label, 'pagination-range');
      this.renderer.setAttribute(this.label, 'role', 'status');
      this.renderer.setAttribute(this.label, 'aria-live', 'polite');
      this.renderer.insertBefore(this.host.nativeElement, this.label, this.host.nativeElement.firstChild);
    }
    if (value !== this.previous) {
      this.renderer.setProperty(this.label, 'textContent', value);
      this.previous = value;
    }
  }
}