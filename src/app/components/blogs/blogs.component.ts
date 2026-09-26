import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../shared/services/shared.service';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { AddUpdateBlogComponent } from './add-update-blog/add-update-blog.component';
import { BlogsService } from './blogs.service';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrl: './blogs.component.scss',
})
export class BlogsComponent {
  dataList: any[] = [];
  searchTxt = '';
  page = 1;
  totalCount = 0;
  limit = 10;
  hasEverLoaded = false;
  isTechnicalIssue = false;
  isListLoading = false;
  isSearchLoading = false;
  btnLoading: string | number | null = null;
  isBtnLoading = (action: string, id?: string | number | null) =>
    isActionLoading(this.btnLoading, action, id);

  constructor(
    public sharedservice: SharedService,
    private blogsService: BlogsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.blogsService
      .getAllByPage(this.page, this.limit, this.searchTxt)
      .pipe(
        finalize(() => {
          this.isListLoading = false;
          this.isSearchLoading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.dataList = res.data || [];
            this.totalCount = res.totalCount || 0;
            this.hasEverLoaded = true;
            this.isTechnicalIssue = false;
          }
        },
        error: () => {
          this.isTechnicalIssue = true;
          this.sharedservice.showAlert(2, 'Technical Issue Found !');
        },
      });
  }

  filterData() {
    if (this.isSearchLoading || this.isListLoading) return;
    this.page = 1;
    this.searchTxt = this.searchTxt.trim();
    this.getDataList('search');
  }

  onPageChange(nextPage: any) {
    if (this.isListLoading) return;
    this.page = Number(nextPage) || 1;
    this.getDataList('page');
  }

  onLimitChange() {
    if (this.isListLoading) return;
    this.page = 1;
    this.getDataList('limit');
  }

  addUpdateData(isEdit: boolean, data?: any) {
    const modalRef = this.modalService.open(AddUpdateBlogComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true,
      scrollable: true,
    });
    modalRef.componentInstance.isEdit = isEdit;
    if (data) modalRef.componentInstance.data = data;
    modalRef.result.then((result) => {
      if (result) this.getDataList();
    });
  }

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true,
    });
    modalRef.result.then((result) => {
      if (!result || !id) return;
      this.btnLoading = actionKey('delete', id);
      this.blogsService
        .delete(id)
        .pipe(finalize(() => (this.btnLoading = null)))
        .subscribe({
          next: () => {
            this.sharedservice.showAlert(1, 'Deleted Successfully');
            this.getDataList();
          },
          error: () => this.sharedservice.showAlert(2, 'Something Went Wrong'),
        });
    });
  }

  tagList(tags: string): string[] {
    return String(tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
}
