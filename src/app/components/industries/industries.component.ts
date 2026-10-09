import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IndustriesService } from './industries.service';
import { SharedService } from '../../shared/services/shared.service';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({ selector: 'app-industries', templateUrl: './industries.component.html' })
export class IndustriesComponent implements OnInit {
  rows: any[] = [];
  search = '';
  page = 1;
  limit = 10;
  totalCount = 0;
  loading = false;
  loadError = false;
  saving = false;
  deleting: number | null = null;
  editorOpen = false;
  editingId: number | null = null;
  form = { name: '', isActive: true };
  constructor(public sharedservice: SharedService, private api: IndustriesService, private modal: NgbModal) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    if (this.loading) return;
    this.loading = true;
    this.loadError = false;
    this.api.list(this.page, this.limit, this.search.trim()).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.rows = res.data || [];
        this.totalCount = res.totalCount || 0;
        if (!this.rows.length && this.page > 1) { this.page = 1; this.loading = false; this.load(); }
      },
      error: (err) => { this.loadError = true; this.sharedservice.showAlert(2, err?.error?.error || 'Could not load industries'); },
    });
  }
  filter(): void { this.page = 1; this.load(); }
  changePage(page: number): void { this.page = page; this.load(); }
  edit(row?: any): void {
    this.editingId = row?.id || null;
    this.form = { name: row?.name || '', isActive: row ? !!Number(row.isActive) : true };
    this.editorOpen = true;
  }
  save(): void {
    if (this.saving) return;
    const name = this.form.name.trim();
    if (!name || name.length > 191) { this.sharedservice.showAlert(2, 'Enter an industry name (maximum 191 characters)'); return; }
    this.saving = true;
    const request = this.editingId ? this.api.update(this.editingId, { ...this.form, name }) : this.api.create({ ...this.form, name });
    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.editorOpen = false; this.sharedservice.showAlert(1, 'Industry saved'); this.load(); },
      error: (err) => this.sharedservice.showAlert(2, err?.error?.error || 'Could not save industry'),
    });
  }
  async remove(row: any): Promise<void> {
    if (this.deleting !== null) return;
    const dialog = this.modal.open(DeleteConfirmationComponent, { size: 'md', centered: true });
    try { if (!await dialog.result) return; } catch { return; }
    this.deleting = row.id;
    this.api.delete(row.id).pipe(finalize(() => this.deleting = null)).subscribe({
      next: () => { this.sharedservice.showAlert(1, 'Industry deleted'); this.load(); },
      error: (err) => this.sharedservice.showAlert(2, err?.error?.error || 'Could not delete industry'),
    });
  }
}
