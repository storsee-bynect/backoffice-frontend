import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { AddUpdatePageCategoryComponent } from './add-update-page-category/add-update-page-category.component';
import { SharedService } from '../../shared/services/shared.service';
import { PageCategoryService } from './page-categories.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-page-categories',
  templateUrl: './page-categories.component.html',
  styleUrl: './page-categories.component.scss'
})
export class PageCategoriesComponent {
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

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total Page Categories', value: this.totalCount || 0 },
      { label: 'Showing', value: this.dataList?.length || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private pagecategoryservice: PageCategoryService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.pagecategoryservice.getAllPageCategorysByPage(this.page, this.limit, this.searchTxt).pipe(
      finalize(() => {
        this.isListLoading = false;
        this.isSearchLoading = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          this.dataList = res.data;
          this.totalCount = res.totalCount;
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
    const modalRef = this.modalService.open(AddUpdatePageCategoryComponent, {
      size: 'md',
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
          this.pagecategoryservice.deletePageCategory(id).pipe(
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
