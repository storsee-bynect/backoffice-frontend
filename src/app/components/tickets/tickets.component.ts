import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../shared/services/shared.service';
import { TicketService } from './tickets.service';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrl: './tickets.component.scss'
})
export class TicketsComponent {

  dataList: any = [];

  searchTxt: string = '';
  statusFilter: '' | 'open' | 'closed' = '';
  page: number = 1;
  totalCount: number = 0;
  limit: number = 10;
  hasEverLoaded = false;
  isTechnicalIssue = false;
  isListLoading = false;
  isSearchLoading = false;
  closingId: number | null = null;

  stats = { total: 0, open: 0, closed: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total', value: this.stats.total || 0 },
      { label: 'Open', value: this.stats.open || 0 },
      { label: 'Closed', value: this.stats.closed || 0 },
    ];
  }

  constructor(
    public sharedservice: SharedService,
    private ticketservice: TicketService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' | 'filter' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.ticketservice.getAllTicketsByPage(this.page, this.limit, this.searchTxt, this.statusFilter).pipe(
      finalize(() => {
        this.isListLoading = false;
        this.isSearchLoading = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          this.dataList = res.data || [];
          this.totalCount = res.totalCount;
          if (res?.stats) {
            this.stats = {
              total: Number(res.stats.total || 0),
              open: Number(res.stats.open || 0),
              closed: Number(res.stats.closed || 0),
            };
          }
          this.hasEverLoaded = true;
          this.isTechnicalIssue = false;
        }
      },
      error: () => {
        this.isTechnicalIssue = true;
        this.sharedservice.showAlert(2, 'Technical Issue Found !');
      }
    });
  }

  setStatusFilter(next: '' | 'open' | 'closed') {
    if (this.statusFilter === next || this.isListLoading) return;
    this.statusFilter = next;
    this.page = 1;
    this.getDataList('filter');
  }

  filterData() {
    if (this.isSearchLoading || this.isListLoading) return;
    this.page = 1;
    this.searchTxt = this.searchTxt.trim();
    this.getDataList('search');
  }

  onPageChange(nextPage: number) {
    if (this.isListLoading) return;
    this.page = nextPage;
    this.getDataList('page');
  }

  onLimitChange() {
    if (this.isListLoading) return;
    this.page = 1;
    this.getDataList('limit');
  }

  openTicket(id: number) {
    this.router.navigate(['/tickets', id]);
  }

  closeTicket(event: Event, item: any) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.isOpen(item?.status) || this.closingId) return;

    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });

    modalRef.result.then(result => {
      if (!result) return;
      this.closingId = item.id;
      this.ticketservice.closeTicket(item.id).pipe(
        finalize(() => this.closingId = null)
      ).subscribe({
        next: () => {
          this.sharedservice.showAlert(1, 'Ticket closed');
          this.getDataList('refresh');
        },
        error: (err) => {
          const msg = err?.error?.error || 'Unable to close ticket';
          this.sharedservice.showAlert(2, msg);
        }
      });
    }).catch(() => {});
  }

  isOpen(status: string | number): boolean {
    const s = String(status ?? '').toLowerCase();
    return s === 'open' || s === '1';
  }

  previewText(text: string, max = 88): string {
    const t = String(text || '').trim();
    if (!t) return 'No messages yet';
    return t.length > max ? t.slice(0, max) + '…' : t;
  }

  relativeTime(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  formatDateTime(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${date} - ${time}`;
  }
}
