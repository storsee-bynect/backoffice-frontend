import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { StoreWalletAdminService } from './store-wallet-admin.service';

@Component({
  selector: 'app-store-wallet-modal',
  templateUrl: './store-wallet-modal.component.html',
  styleUrls: ['./store-wallet-modal.component.scss'],
})
export class StoreWalletModalComponent implements OnInit {
  @Input() store: any;

  readonly currencySymbol = '₹';

  prepaidBalance = 0;
  withdrawableBalance = 0;
  totalBalance = 0;

  depositAmount: number | null = null;
  depositRemark = '';
  depositBucket: 'prepaid' | 'withdrawable' = 'prepaid';

  withdrawAmount: number | null = null;
  withdrawRemark = '';
  withdrawBucket: 'prepaid' | 'withdrawable' = 'withdrawable';

  ledger: any[] = [];
  ledgerPage = 1;
  ledgerTotal = 0;
  ledgerLimit = 30;

  withdrawRequests: any[] = [];
  requestsPage = 1;
  requestsTotal = 0;
  requestsLimit = 20;
  requestFilter: '' | 'pending' | 'approved' | 'rejected' = 'pending';

  loading = true;
  saving = false;
  reviewingId: number | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    public sharedservice: SharedService,
    private walletService: StoreWalletAdminService,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  get storeId(): number {
    return Number(this.store?.id || 0);
  }

  money(n: number): string {
    return `${this.currencySymbol}${Number(n || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  }

  refresh(): void {
    if (!this.storeId) return;
    this.loading = true;
    this.walletService.getWallet(this.storeId).subscribe({
      next: (res) => {
        this.applyBalances(res?.data || {});
        this.loading = false;
        this.loadLedger(1);
        this.loadWithdrawRequests(1);
      },
      error: (err) => {
        this.loading = false;
        this.sharedservice.showAlert(2, err?.error?.error || 'Failed to load wallet');
      },
    });
  }

  loadLedger(page = 1): void {
    this.ledgerPage = page;
    this.walletService.getLedger(this.storeId, page, this.ledgerLimit).subscribe({
      next: (res) => {
        this.ledger = res?.data || [];
        this.ledgerTotal = Number(res?.totalCount || 0);
      },
      error: () => {},
    });
  }

  loadWithdrawRequests(page = 1): void {
    this.requestsPage = page;
    const status = this.requestFilter || undefined;
    this.walletService.getWithdrawRequests(this.storeId, page, this.requestsLimit, status).subscribe({
      next: (res) => {
        this.withdrawRequests = res?.data || [];
        this.requestsTotal = Number(res?.totalCount || 0);
      },
      error: () => {},
    });
  }

  onRequestFilterChange(): void {
    this.loadWithdrawRequests(1);
  }

  get ledgerPages(): number {
    return Math.max(1, Math.ceil(this.ledgerTotal / this.ledgerLimit));
  }

  get requestsPages(): number {
    return Math.max(1, Math.ceil(this.requestsTotal / this.requestsLimit));
  }

  doDeposit(): void {
    const amount = Number(this.depositAmount);
    if (!amount || amount < 1) {
      this.sharedservice.showAlert(2, 'Enter deposit amount ≥ ₹1');
      return;
    }
    this.saving = true;
    this.walletService
      .deposit(this.storeId, {
        amount,
        remark: this.depositRemark || 'Admin deposit',
        bucket: this.depositBucket,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.depositAmount = null;
          this.depositRemark = '';
          this.applyBalances(res?.data || {});
          this.sharedservice.showAlert(1, 'Deposit recorded');
          this.loadLedger(1);
        },
        error: (err) => {
          this.saving = false;
          this.sharedservice.showAlert(2, err?.error?.error || 'Deposit failed');
        },
      });
  }

  doWithdraw(): void {
    const amount = Number(this.withdrawAmount);
    if (!amount || amount < 1) {
      this.sharedservice.showAlert(2, 'Enter withdraw amount ≥ ₹1');
      return;
    }
    this.saving = true;
    this.walletService
      .withdraw(this.storeId, {
        amount,
        remark: this.withdrawRemark || 'Admin withdraw',
        bucket: this.withdrawBucket,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.withdrawAmount = null;
          this.withdrawRemark = '';
          this.applyBalances(res?.data || {});
          this.sharedservice.showAlert(1, 'Withdraw recorded');
          this.loadLedger(1);
        },
        error: (err) => {
          this.saving = false;
          this.sharedservice.showAlert(2, err?.error?.error || 'Withdraw failed');
        },
      });
  }

  approveRequest(row: any): void {
    if (!row?.id || this.reviewingId) return;
    this.reviewingId = row.id;
    this.walletService.approveWithdraw(row.id, 'Approved').subscribe({
      next: (res) => {
        this.reviewingId = null;
        if (res?.data) this.applyBalances(res.data);
        this.sharedservice.showAlert(1, 'Withdraw approved');
        this.loadWithdrawRequests(this.requestsPage);
        this.loadLedger(1);
      },
      error: (err) => {
        this.reviewingId = null;
        this.sharedservice.showAlert(2, err?.error?.error || 'Approve failed');
      },
    });
  }

  rejectRequest(row: any): void {
    if (!row?.id || this.reviewingId) return;
    const note = window.prompt('Reject reason (optional):', '') ?? '';
    this.reviewingId = row.id;
    this.walletService.rejectWithdraw(row.id, note || 'Rejected').subscribe({
      next: (res) => {
        this.reviewingId = null;
        if (res?.data) this.applyBalances(res.data);
        this.sharedservice.showAlert(1, 'Withdraw rejected · amount restored');
        this.loadWithdrawRequests(this.requestsPage);
        this.loadLedger(1);
      },
      error: (err) => {
        this.reviewingId = null;
        this.sharedservice.showAlert(2, err?.error?.error || 'Reject failed');
      },
    });
  }

  entrySign(row: any): string {
    return row?.direction === 'DEBIT' ? '−' : '+';
  }

  entryClass(row: any): string {
    return row?.direction === 'DEBIT' ? 'is-debit' : 'is-credit';
  }

  statusClass(status: string): string {
    if (status === 'approved') return 'is-ok';
    if (status === 'rejected') return 'is-bad';
    return 'is-pending';
  }

  private applyBalances(d: any): void {
    this.prepaidBalance = Number(d.prepaidBalance || 0);
    this.withdrawableBalance = Number(d.withdrawableBalance || 0);
    this.totalBalance = Number(
      d.totalBalance != null ? d.totalBalance : this.prepaidBalance + this.withdrawableBalance
    );
  }
}
