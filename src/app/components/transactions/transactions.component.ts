import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
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

  get countItems(): { label: string; value: number | string }[] {
    return [
      { label: 'Total', value: this.stats.total || 0 },
      { label: 'Completed', value: this.stats.completed || 0 },
      { label: 'Cancelled', value: this.stats.cancelled || 0 },
      { label: 'Revenue', value: `₹${Number(this.stats.revenue || 0).toLocaleString('en-IN')}` },
    ];
  }

  private storeIdFilter: number | null = null;

  constructor(
    public sharedservice: SharedService,
    private transactionservice: TransactionService,
    private modalService: NgbModal,
    private route: ActivatedRoute
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
          this.dataList = res.data;
          this.totalCount = this.dataList.length;
          const list = this.dataList || [];
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
    });
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

  downloadInvoice(item: any): void {
    if (!item?.id || this.invoiceLoadingId) return;
    this.invoiceLoadingId = item.id;

    const invoiceOpts = {
      logoUrl: this.sharedservice.getSiteLogoLight(),
      siteName: this.sharedservice.siteConfig?.siteName || 'Storsee',
      primaryColor: '#0b72e7',
      supportEmail: this.sharedservice.siteConfig?.email,
      supportPhone: this.sharedservice.siteConfig?.mobile,
    };

    const fallback = async () => {
      await downloadPlanInvoicePdf(
        {
          invoiceNo: item.invoiceNo || `INV-${item.id}`,
          storeName: item.storeName,
          storeEmail: item.storeEmail,
          storePhone: item.storePhone,
          storeSlug: item.storeSlug,
          plan: item.plan,
          amount: Number(item.amt || 0),
          discountAmt: Number(item.discountAmt || 0),
          couponCode: item.couponCode,
          paymentId: item.paymentId,
          type: item.type,
          status: Number(item.status) === 1 ? 'Paid' : 'Cancelled',
          note: item.note,
          created_at: item.created_at,
        },
        invoiceOpts
      );
      this.sharedservice.showAlert(1, 'Invoice downloaded');
    };

    this.transactionservice
      .getTransactionInvoice(item.id)
      .pipe(finalize(() => (this.invoiceLoadingId = null)))
      .subscribe({
        next: async (res: any) => {
          try {
            await downloadPlanInvoicePdf(
              res?.data || {
                ...item,
                amount: item.amt,
                status: Number(item.status) === 1 ? 'Paid' : 'Cancelled',
              },
              invoiceOpts
            );
            this.sharedservice.showAlert(1, 'Invoice downloaded');
          } catch (err) {
            console.error('Invoice PDF error', err);
            try {
              await fallback();
            } catch {
              this.sharedservice.showAlert(2, 'Could not generate invoice');
            }
          }
        },
        error: async (err) => {
          console.error('Invoice API error', err);
          try {
            await fallback();
          } catch {
            this.sharedservice.showAlert(2, 'Could not generate invoice');
          }
        },
      });
  }
}
