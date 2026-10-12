import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { environment } from '../../shared/environment/environment';
import { SharedService } from '../../shared/services/shared.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
@Component({selector: 'app-fonts', standalone: true, imports: [CommonModule, FormsModule, BreadcrumbComponent], templateUrl: './fonts.component.html', styleUrl: './fonts.component.scss'})
export class FontsComponent implements OnInit, OnDestroy {
  rows: any[] = []; page = 1; limit = 30; total = 0; search = ''; loading = false; failed = false; saving: number | null = null;
  private request?: Subscription;
  constructor(private http: HttpClient, public shared: SharedService, private cdr: ChangeDetectorRef) {}
  get base() { return environment.APIUrl + 'fonts/admin'; }
  get pages() { return Math.max(1, Math.ceil(this.total / this.limit)); }
  ngOnInit() { this.load(); }
  ngOnDestroy() { this.request?.unsubscribe(); }
  load(reset = false) {
    if (reset) this.page = 1;
    this.request?.unsubscribe(); this.loading = true; this.failed = false;
    this.request = this.http.get<any>(this.base, {params: {page: this.page, limit: this.limit, searchtxt: this.search.trim()}}).pipe(finalize(() => {this.loading = false; this.cdr.markForCheck();})).subscribe({next: r => {this.rows = r.data || []; this.total = r.totalCount || 0; this.cdr.markForCheck();}, error: () => {this.failed = true; this.cdr.markForCheck();}});
  }
  toggle(row: any) {
    if (this.saving != null || !this.shared.isPageUpdate) return;
    this.saving = row.id;
    this.http.patch(this.base + '/' + row.id + '/status', {isEnabled: Number(row.isEnabled) !== 1}).pipe(finalize(() => {this.saving = null; this.cdr.markForCheck();})).subscribe({next: () => {row.isEnabled = Number(row.isEnabled) === 1 ? 0 : 1; this.cdr.markForCheck();}, error: () => this.shared.showAlert(2, 'Could not change the font status. Please try again.')});
  }
  move(page: number) { this.page = page; this.load(); }
}
