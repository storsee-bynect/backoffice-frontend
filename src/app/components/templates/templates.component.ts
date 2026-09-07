import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { SharedService } from '../../shared/services/shared.service';
import { TemplateService } from './templates.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddUpdateTemplateComponent } from './add-update-template/add-update-template.component';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss'
})
export class TemplatesComponent {
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

  stats = { total: 0, active: 0, inactive: 0, free: 0, paid: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total Templates', value: this.stats.total || 0 },
      { label: 'Active', value: this.stats.active || 0 },
      { label: 'Inactive', value: this.stats.inactive || 0 },
      { label: 'Free', value: this.stats.free || 0 },
      { label: 'Paid', value: this.stats.paid || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private templateservice: TemplateService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.templateservice.getAllTemplatesByPage(this.page, this.limit, this.searchTxt).pipe(
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
              free: Number(res.stats.free || 0),
              paid: Number(res.stats.paid || 0),
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
    const modalRef = this.modalService.open(AddUpdateTemplateComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
      scrollable: true,
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
          this.templateservice.deleteTemplate(id).pipe(
            finalize(() => this.btnLoading = null)
          ).subscribe({
            next: () => {
              this.sharedservice.showAlert(1, 'Deleted Successfully');
              this.getDataList();
            },
            error: (err) => {
              const msg = err?.error?.message || 'Something Went Wrong';
              this.sharedservice.showAlert(2, msg);
            }
          });
        } else {
          this.sharedservice.showAlert(2, 'Delete Target Not Available');
        }
      }
    });
  }
}
