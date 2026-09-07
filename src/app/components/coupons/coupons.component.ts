import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { SharedService } from '../../shared/services/shared.service';
import { CouponService } from './coupons.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddUpdateCouponComponent } from './add-update-coupon/add-update-coupon.component';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-coupons',
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss'
})
export class CouponsComponent {

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

  stats = { total: 0, valid: 0, expired: 0, percentage: 0, flat: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total', value: this.stats.total || 0 },
      { label: 'Valid', value: this.stats.valid || 0 },
      { label: 'Expired', value: this.stats.expired || 0 },
      { label: 'Percentage Wise', value: this.stats.percentage || 0 },
      { label: 'Flat Amount Wise', value: this.stats.flat || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private couponservice: CouponService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.couponservice.getAllCouponsByPage(this.page, this.limit, this.searchTxt).pipe(
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
              valid: Number(res.stats.valid || 0),
              expired: Number(res.stats.expired || 0),
              percentage: Number(res.stats.percentage || 0),
              flat: Number(res.stats.flat || 0),
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
    const modalRef = this.modalService.open(AddUpdateCouponComponent, {
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

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });
    modalRef.result.then(result => {
      if (result) {
        if (id) {
          this.btnLoading = actionKey('delete', id);
          this.couponservice.deleteCoupon(id).pipe(
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
}
