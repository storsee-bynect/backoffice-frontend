import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appBtnLoading]',
  standalone: true,
})
export class BtnLoadingDirective implements OnChanges {
  @Input('appBtnLoading') loading = false;

  private disabledByLoader = false;
  private savedMinWidth = '';
  private structureReady = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    const host = this.el.nativeElement;
    this.ensureStructure(host);

    if (this.loading) {
      if (!host.classList.contains('is-btn-loading')) {
        this.savedMinWidth = host.style.minWidth;
        if (host.offsetWidth > 0) {
          host.style.minWidth = `${host.offsetWidth}px`;
        }
      }

      host.classList.add('is-btn-loading');
      if (!host.hasAttribute('disabled')) {
        host.setAttribute('disabled', 'true');
        this.disabledByLoader = true;
      }
      return;
    }

    host.classList.remove('is-btn-loading');
    host.style.minWidth = this.savedMinWidth;
    this.savedMinWidth = '';

    if (this.disabledByLoader) {
      host.removeAttribute('disabled');
      this.disabledByLoader = false;
    }
  }

  private ensureStructure(host: HTMLElement): void {
    if (this.structureReady) return;

    this.wrapTextNodes(host);
    this.markTextElements(host);

    const iconContainer =
      host.querySelector(':scope > .site-btn-icon') ||
      host.querySelector(':scope > .eo-chart-range-ico') ||
      host.querySelector(':scope > .ob-slug-check-btn__icon');

    if (iconContainer) {
      this.normalizeIconContainer(iconContainer as HTMLElement);
    } else {
      const directIcon = host.querySelector(':scope > i:not(.fa-spin)') as HTMLElement | null;
      if (directIcon) {
        this.normalizeDirectIcon(directIcon);
      } else if (!host.querySelector('.btn-icon-loading')) {
        this.addLoadingSlot(host);
      }
    }

    this.structureReady = true;
  }

  private wrapTextNodes(host: HTMLElement): void {
    Array.from(host.childNodes).forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return;
      const span = document.createElement('span');
      span.className = 'btn-text';
      span.textContent = node.textContent.trim();
      host.replaceChild(span, node);
    });
  }

  private markTextElements(host: HTMLElement): void {
    Array.from(host.children).forEach((node) => {
      const el = node as HTMLElement;
      if (this.isIconSlot(el)) return;
      if (
        el.classList.contains('btn-text') ||
        el.classList.contains('cat-action-label') ||
        el.classList.contains('eo-chart-range-label') ||
        el.classList.contains('eo-chart-range-caret') ||
        el.classList.contains('orders-filter-badge')
      ) {
        return;
      }
      if (el.tagName === 'SPAN' || el.tagName === 'DIV') {
        el.classList.add('btn-text');
      }
    });
  }

  private isIconSlot(el: HTMLElement): boolean {
    return (
      el.classList.contains('site-btn-icon') ||
      el.classList.contains('eo-chart-range-ico') ||
      el.classList.contains('ob-slug-check-btn__icon') ||
      el.classList.contains('btn-icon-default') ||
      el.classList.contains('btn-icon-loading')
    );
  }

  private normalizeIconContainer(container: HTMLElement): void {
    if (container.querySelector('.btn-icon-loading')) return;

    if (!container.querySelector('.btn-icon-default')) {
      const defaultSlot = document.createElement('span');
      defaultSlot.className = 'btn-icon-default';
      while (container.firstChild) {
        defaultSlot.appendChild(container.firstChild);
      }
      container.appendChild(defaultSlot);
    }

    const loadingSlot = document.createElement('span');
    loadingSlot.className = 'btn-icon-loading';
    loadingSlot.innerHTML = '<span class="icon-wrap"><i class="fa-solid fa-spinner fa-spin"></i></span>';
    container.appendChild(loadingSlot);
  }

  private normalizeDirectIcon(icon: HTMLElement): void {
    const host = this.el.nativeElement;
    if (host.querySelector('.btn-icon-loading')) return;

    const defaultSlot = document.createElement('span');
    defaultSlot.className = 'btn-icon-default';
    icon.replaceWith(defaultSlot);
    defaultSlot.appendChild(icon);

    const loadingSlot = document.createElement('span');
    loadingSlot.className = 'btn-icon-loading';
    loadingSlot.innerHTML = '<span class="icon-wrap"><i class="fa-solid fa-spinner fa-spin"></i></span>';
    host.insertBefore(loadingSlot, defaultSlot.nextSibling);
  }

  private addLoadingSlot(host: HTMLElement): void {
    const loadingSlot = document.createElement('span');
    loadingSlot.className = 'btn-icon-loading';
    loadingSlot.innerHTML = '<span class="icon-wrap"><i class="fa-solid fa-spinner fa-spin"></i></span>';
    host.prepend(loadingSlot);
  }
}
