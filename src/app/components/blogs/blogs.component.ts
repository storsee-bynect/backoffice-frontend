import { Component, OnDestroy } from '@angular/core';
import {StoreAppItem, StoreAppsService} from '../blog-setting/blog-setting.service';
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
export class BlogsComponent implements OnDestroy {
  publishingApps:StoreAppItem[]=[]; postingKey=''; private poll?:ReturnType<typeof setInterval>;
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
    private modalService: NgbModal,
    private appsService:StoreAppsService
  ) {}

  ngOnInit(): void {
    this.getDataList();
    this.loadPublishingApps();
    this.poll=setInterval(()=>{if(this.dataList.some(b=>(b.externalPosts || []).some((p:any)=>['pending','publishing'].includes(p.status))))this.refreshPublishingStatuses();},6000);
  }

  ngOnDestroy(){if(this.poll)clearInterval(this.poll);}
  private loadPublishingApps(){this.appsService.list().subscribe({next:r=>this.publishingApps=r.data.filter(a=>a.code === 'blogger'),error:()=>{this.publishingApps=[];}});}
  get hasActivePublisher(){return this.publishingApps.some(app=>app.enabled && app.connection?.connected);}
  private refreshPublishingStatuses(){if(this.isListLoading)return;this.blogsService.getAllByPage(this.page,this.limit,this.searchTxt).subscribe({next:r=>{for(const blog of this.dataList){const updated=r.data?.find((b:any)=>b.id===blog.id);if(updated)blog.externalPosts=updated.externalPosts;}this.loadPublishingApps();},error:()=>{}});}
  postState(blog:any, code:string):any{return (blog.externalPosts || []).find((p:any)=>p.provider===code);}
  canPost(blog:any,app:StoreAppItem):boolean {const state=this.postState(blog,app.code);return this.sharedservice.isPageUpdate && Number(blog.status)===1 && app.enabled && !!app.connection?.connected && (app.settings.postingMode==='manual' || state?.status==='failed') && (!state || state.status==='failed');}
  post(blog:any,app:StoreAppItem){
    if(this.postingKey || !this.canPost(blog,app))return;
    this.postingKey=blog.id+':'+app.code;
    this.appsService.publish(app.code,blog.id).pipe(finalize(()=>this.postingKey='')).subscribe({next:r=>{
      blog.externalPosts=(blog.externalPosts || []).filter((p:any)=>p.provider!==app.code);if(r.data)blog.externalPosts.push(r.data);
      this.sharedservice.showAlert(r.data?.status==='succeeded' ? 1 : 2,r.data?.status==='succeeded' ? `Posted to ${app.name} successfully` : r.data?.error || `Posting to ${app.name} is in progress`);
      this.loadPublishingApps();
    },error:e=>this.sharedservice.showAlert(2,e?.error?.error || 'Could not post this blog.')});
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
