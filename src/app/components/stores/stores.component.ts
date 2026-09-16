import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { AddUpdateStoreComponent } from './add-update-store/add-update-store.component';
import { SharedService } from '../../shared/services/shared.service';
import { StoreService } from './stores.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewTemplateDetailComponent } from '../templates/view-template-detail/view-template-detail.component';
import { StoreUsersListComponent } from './store-users-list/store-users-list.component';
import { StorePlanHistoryComponent } from './store-plan-history/store-plan-history.component';
import { StoreSettingsComponent } from './store-settings/store-settings.component';
import { formatPhoneDisplay } from '../../shared/constant/country-codes';

@Component({
  selector: 'app-stores',
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss'
})
export class StoresComponent {
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

  /** True while this store row is deleting / status-updating */
  isStoreBusy(id: string | number | null | undefined): boolean {
    if (id == null) return false;
    return this.isBtnLoading('delete', id) || this.isBtnLoading('status', id);
  }

  /** Any store currently deleting — block create / list spam */
  get isAnyStoreDeleting(): boolean {
    return typeof this.btnLoading === 'string' && String(this.btnLoading).startsWith('delete:');
  }

  stats = { total: 0, active: 0, inactive: 0, locked: 0, blacklisted: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total Stores', value: this.stats.total || 0 },
      { label: 'Active', value: this.stats.active || 0 },
      { label: 'Inactive', value: this.stats.inactive || 0 },
      { label: 'Locked', value: this.stats.locked || 0 },
      { label: 'Blacklisted', value: this.stats.blacklisted || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private storeservice: StoreService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.storeservice.getAllStoresByPage(this.page, this.limit, this.searchTxt).pipe(
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
              active: Number(res.stats.active || 0),
              inactive: Number(res.stats.inactive || 0),
              locked: Number(res.stats.locked || 0),
              blacklisted: Number(res.stats.blacklisted || 0),
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

  addUpdateData(isedit: boolean, data?) {
    const modalRef = this.modalService.open(AddUpdateStoreComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isedit;
    if (data) {
      modalRef.componentInstance.data = data;
    }
    modalRef.result.then(result => {
      if (result) {
        this.getDataList();
      }
    });
  }

  viewTemplate(id: number) {
    const modalRef = this.modalService.open(ViewTemplateDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.id = id;
  }

  viewStoreUsers(storeId: number) {
    const modalRef = this.modalService.open(StoreUsersListComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.storeId = storeId;
  }

  viewPlanHistory(store: any) {
    const modalRef = this.modalService.open(StorePlanHistoryComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.store = store;
  }

  openStoreSettings(store: any) {
    const modalRef = this.modalService.open(StoreSettingsComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.store = store;
    modalRef.result.then(result => {
      if (result) {
        this.getDataList();
      }
    }).catch(() => {});
  }

  deleteData(id: number) {
    if (this.isStoreBusy(id) || this.isAnyStoreDeleting) return;
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });
    modalRef.componentInstance.title = 'Permanently delete this store?';
    modalRef.componentInstance.message =
      'Hard delete: store admins/users, customers, products, orders, categories, brands, banners, pages, coupons, leads, tickets, files, images, and all other store data will be permanently removed. This cannot be undone.';
    modalRef.result.then(result => {
      if (result) {
        if (id) {
          this.btnLoading = actionKey('delete', id);
          this.storeservice.deleteStore(id).pipe(
            finalize(() => this.btnLoading = null)
          ).subscribe({
            next: () => {
              this.sharedservice.showAlert(1, 'Store hard-deleted with all related data & media');
              this.getDataList();
            },
            error: (err) => {
              this.sharedservice.showAlert(
                2,
                err?.error?.message || err?.error?.error || 'Failed to delete store'
              );
            }
          });
        } else {
          this.sharedservice.showAlert(2, 'Delete Target Not Available');
        }
      }
    });
  }

  updateStatus(newStatus, data) {
    if (!data?.id || this.isStoreBusy(data.id)) return;
    this.btnLoading = actionKey('status', data.id);
    const body = {
      isActive: !!newStatus,
      isLocked: !!data.isLocked,
      isBlacklisted: !!data.isBlacklisted,
      allowStorefront: data.allowStorefront !== 0 && data.allowStorefront !== false,
      allowDashboard: data.allowDashboard !== 0 && data.allowDashboard !== false,
      allowCheckout: data.allowCheckout !== 0 && data.allowCheckout !== false,
      allowProductAdd: data.allowProductAdd !== 0 && data.allowProductAdd !== false,
      productLimit: Number(data.productLimit || 0),
      maxOrders: Number(data.maxOrders || 0),
      lockReason: newStatus
        ? (String(data.lockReason || '').trim() === 'Store marked inactive by platform administrator.'
            ? ''
            : (data.lockReason || ''))
        : (String(data.lockReason || '').trim() || 'Store marked inactive by platform administrator.'),
      adminNotes: data.adminNotes || '',
    };
    this.storeservice.updateStoreSettings(data.id, body).pipe(
      finalize(() => this.btnLoading = null)
    ).subscribe({
      next: () => {
        this.getDataList();
        this.sharedservice.showAlert(1, newStatus ? 'Store activated' : 'Store marked inactive');
      },
      error: (err) => {
        this.sharedservice.showAlert(2, err.error?.message || err.error?.error || 'Something went wrong');
      }
    });
  }

  formatPhone(item: any): string {
    return formatPhoneDisplay(item?.countryCode, item?.phone);
  }

  getExpireDate(item: any): Date | null {
    return this.parseExpireDate(item?.expireDate);
  }

  getRemainingDays(item: any): number | null {
    if (!item?.expireDate) return null;
    const exp = this.parseExpireDate(item.expireDate);
    if (!exp) return 0;

    const diffMs = exp.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    const fullDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return fullDays === 0 ? 1 : fullDays;
  }

  private parseExpireDate(expireDateStr: string | null | undefined): Date | null {
    if (!expireDateStr) {
      return null;
    }

    const raw = String(expireDateStr).trim();

    if (raw.includes('T')) {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }

    const parts = raw.split(' ');
    if (parts.length !== 2) {
      return null;
    }

    const [datePart, timePart] = parts;
    const [yStr, mStr, dStr] = datePart.split('-');
    const [hStr, minStr] = timePart.split(':');

    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const h = Number(hStr);
    const mi = Number(minStr);

    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(mi)) {
      return null;
    }

    return new Date(Date.UTC(y, m - 1, d, h, mi));
  }
}
