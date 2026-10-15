import { Component, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { SiteConfigService } from '../../shared/services/site-config.service';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { SharedService } from '../../shared/services/shared.service';
import { TransactionService } from './transactions.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { downloadPlanInvoicePdf } from '../../shared/utils/plan-invoice.util';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent {
  dataList: any = [];

  searchTxt: string = '';
  page: number = 1;
  totalCount: number = 0;
  limit: number = 10;
  hasEverLoaded = false;
  isTechnicalIssue: boolean = false;
  isListLoading = false;
  isSearchLoading = false;
  btnLoading: string | number | null = null;
  isBtnLoading = (action: string, id?: string | number | null) => isActionLoading(this.btnLoading, action, id);

  stats = { total: 0, completed: 0, cancelled: 0, revenue: 0 };
  invoiceLoadingId: number | null = null;
  selectedTransaction: any = null;

  viewTransaction(item: any, template: TemplateRef<any>): void {
    this.selectedTransaction = item;
    this.modalService.open(template, { size: 'lg', centered: true, scrollable: true });
  }

  money(value: any): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(value) || 0);
  }

  clearSearch(): void {
    this.searchTxt = '';
    this.filterData();
  }

  private storeIdFilter: number | null = null;

  constructor(
    public sharedservice: SharedService,
    private transactionservice: TransactionService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private siteConfigService: SiteConfigService
  ) {}

  ngOnInit(): void {
    const storeIdParam = this.route.snapshot.queryParamMap.get('storeId');
    if (storeIdParam) {
      this.storeIdFilter = Number(storeIdParam);
      this.getStoreTransactions();
    } else {
      this.getDataList();
    }
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.storeIdFilter) {
      if (source === 'search' && !this.isListLoading) this.isSearchLoading = true;
      this.getStoreTransactions();
      return;
    }
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.transactionservice.getAllTransactionsByPage(this.page, this.limit, this.searchTxt).pipe(
      finalize(() => {
        this.isListLoading = false;
        this.isSearchLoading = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          this.dataList = res.data;
          this.totalCount = res.totalCount;
          if (res?.stats) {
            this.stats = {
              total: Number(res.stats.total || 0),
              completed: Number(res.stats.completed || 0),
              cancelled: Number(res.stats.cancelled || 0),
              revenue: Number(res.stats.revenue || 0),
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

  private getStoreTransactions() {
    if (!this.storeIdFilter || this.isListLoading) {
      return;
    }
    this.isListLoading = true;

    this.transactionservice.getTransactionByStoreId(this.storeIdFilter).pipe(
      finalize(() => {
        this.isListLoading = false;
        this.isSearchLoading = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const list = res.data || [];
          const query = this.searchTxt.trim().toLowerCase();
          const filtered = query ? list.filter((item: any) =>
            ['invoiceNo', 'paymentId', 'storeName', 'storeEmail', 'storeSlug', 'plan', 'couponCode', 'type', 'note', 'amt']
              .some(key => String(item[key] ?? '').toLowerCase().includes(query))) : list;
          this.totalCount = filtered.length;
          this.page = Math.min(this.page, Math.max(1, Math.ceil(this.totalCount / Number(this.limit))));
          this.dataList = filtered.slice((this.page - 1) * Number(this.limit), this.page * Number(this.limit));
          this.stats = {
            total: list.length,
            completed: list.filter((t: any) => Number(t.status) === 1).length,
            cancelled: list.filter((t: any) => Number(t.status) !== 1).length,
            revenue: list
              .filter((t: any) => Number(t.status) === 1)
              .reduce((sum: number, t: any) => sum + Number(t.amt || 0), 0),
          };
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

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });
    modalRef.result.then(result => {
      if (result) {
        if (id) {
          this.btnLoading = actionKey('delete', id);
          this.transactionservice.deleteTransaction(id).pipe(
            finalize(() => this.btnLoading = null)
          ).subscribe({
            next: () => {
              this.sharedservice.showAlert(1, 'Deleted Successfully');
              if (this.dataList.length === 1 && this.page > 1) this.page--;
              this.getDataList();
            },
            error: () => {
              this.sharedservice.showAlert(2, 'Something Went Wrong');
            }
          });
        } else {
          this.sharedservice.showAlert(2, 'Delete Target Not Available');
        }
      }
    }).catch(() => {});
  }

  formatDate(value: string): string {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        return String(value).split('T')[0];
      }
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(value).slice(0, 16);
    }
  }

  async downloadInvoice(item: any): Promise<void> {
    if (!item?.id || this.invoiceLoadingId !== null) return;
    this.invoiceLoadingId = item.id;
    try {
      const [configuration, transaction] = await Promise.all([
        firstValueFrom(this.siteConfigService.getSiteConfig()) as Promise<any>,
        firstValueFrom(this.transactionservice.getTransactionInvoice(item.id))
      ]);
      const config = configuration?.data?.[0];
      if (!config || !transaction?.data) throw new Error('Invoice information is unavailable');
      await downloadPlanInvoicePdf(transaction.data, {
        logoUrl: 'assets/img/storsee-invoice-logo.png',
        siteName: config.siteName || 'Storsee',
        primaryColor: '#0b72e7',
        supportEmail: config.email,
        supportPhone: config.mobile,
        companyName: config.parentCompany,
      });
      this.sharedservice.showAlert(1, 'Invoice downloaded');
    } catch {
      this.sharedservice.showAlert(2, 'Could not generate invoice. Please try again.');
    } finally {
      this.invoiceLoadingId = null;
    }
  }
}
