import { Component, Input, OnDestroy, OnInit, Optional, TemplateRef } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreService } from '../stores/stores.service';

export interface StoreReport {
  id: number;
  storeId: number;
  storeName: string;
  slug: string;
  isActive: number;
  email: string;
  message: string;
  created_at: string;
}

@Component({
  selector: 'app-store-reports',
  templateUrl: './store-reports.component.html',
  styleUrl: './store-reports.component.scss',
  host: { '[class.popup-main]': 'modalMode' },
})
export class StoreReportsComponent implements OnInit, OnDestroy {
  @Input() storeId: number | null = null;
  @Input() storeName = '';
  @Input() modalMode = false;
  rows: StoreReport[] = [];
  search = '';
  status = '';
  page = 1;
  limit = 10;
  totalCount = 0;
  loading = false;
  failed = false;
  hasLoaded = false;
  selectedReport: StoreReport | null = null;
  private request?: Subscription;

  constructor(private stores: StoreService, private modal: NgbModal, @Optional() public activeModal: NgbActiveModal | null) {}

  get paginationId(): string { return 'store-reports-' + (this.storeId ?? 'all'); }
  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.request?.unsubscribe(); }

  load(): void {
    if (this.loading) return;
    this.loading = true;
    this.failed = false;
    this.request = this.stores.allAbuseReports(this.page, this.limit, this.search.trim(), this.status, this.storeId)
      .pipe(finalize(() => this.loading = false)).subscribe({
        next: response => {
          this.rows = response.data || [];
          this.totalCount = Number(response.total) || 0;
          this.hasLoaded = true;
        },
        error: () => { this.rows = []; this.totalCount = 0; this.failed = true; this.hasLoaded = true; },
      });
  }
  filter(): void { if (this.loading) return; this.page = 1; this.load(); }
  changePage(page: number): void { if (this.loading || page === this.page) return; this.page = page; this.load(); }
  clear(): void { this.search = ''; this.status = ''; this.filter(); }
  view(report: StoreReport, template: TemplateRef<unknown>): void {
    this.selectedReport = report;
    this.modal.open(template, { size: 'lg', centered: true, scrollable: true });
  }
}
