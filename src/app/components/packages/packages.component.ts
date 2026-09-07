import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { SharedService } from '../../shared/services/shared.service';
import { PackageService } from './packages.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddUpdatePackageComponent } from './add-update-package/add-update-package.component';
import { PackageBenefitsComponent } from './package-benefits/package-benefits.component';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss'
})
export class PackagesComponent {

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

  stats = { total: 0, active: 0, inactive: 0, popular: 0, recommended: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total Plans', value: this.stats.total || 0 },
      { label: 'Active', value: this.stats.active || 0 },
      { label: 'Inactive', value: this.stats.inactive || 0 },
      { label: 'Popular', value: this.stats.popular || 0 },
      { label: 'Recommended', value: this.stats.recommended || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private packageservice: PackageService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.packageservice.getAllPackagesByPage(this.page, this.limit, this.searchTxt).pipe(
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
              popular: Number(res.stats.popular || 0),
              recommended: Number(res.stats.recommended || 0),
            };
          }
          this.hasEverLoaded = true;
          this.isTechnicalIssue = false;
        }
      },
      error: () => {
        this.isTechnicalIssue = true;
        this.sharedservice.showAlert(2, 'Technical Issue Found!');
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

  parseBenefits(benefits: any): any[] {
    if (!benefits) return [];
    try {
      console.log(' ---->', JSON.parse(benefits));

      return typeof benefits === 'string' ? JSON.parse(benefits) : benefits;
    } catch {
      return [];
    }
  }

  addUpdateData(isedit: boolean, data?: any) {
    const modalRef = this.modalService.open(AddUpdatePackageComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isedit;
    if (data) {
      modalRef.componentInstance.data = data;
    }
    modalRef.result.then(result => {
      if (result) { this.getDataList(); }
    });
  }

  viewBenefit(data: any) {
    const modalRef = this.modalService.open(PackageBenefitsComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.name = data.name;
    modalRef.componentInstance.data = this.parseBenefits(data.benefits);
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
          this.packageservice.deletePackage(id).pipe(
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
        }
      }
    });
  }
}
