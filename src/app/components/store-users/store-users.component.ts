import { Component, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { SharedService } from '../../shared/services/shared.service';
import { StoreuserService } from './store-users.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AddUpdateStoreUserComponent } from './add-update-store-user/add-update-store-user.component';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { ViewStoreDetailComponent } from '../stores/view-store-detail/view-store-detail.component';

@Component({
  selector: 'app-store-users',
  templateUrl: './store-users.component.html',
  styleUrl: './store-users.component.scss'
})
export class StoreUsersComponent implements OnDestroy {
  @ViewChild('otpHistoryModal') otpHistoryModal:any;
  otpUser:any;otpRows:any[]=[];otpLoading=false;otpFailed=false;
  otpPage=1;otpLimit=10;otpTotal=0;
  private otpRequest?:Subscription;private otpModal?:NgbModalRef;
  ngOnDestroy(){this.otpRequest?.unsubscribe();this.otpModal?.close();}
  viewOtp(user:any){
    this.otpRequest?.unsubscribe();this.otpModal?.close();this.otpUser=user;this.otpRows=[];this.otpPage=1;this.otpTotal=0;
    const modal=this.modalService.open(this.otpHistoryModal,{size:'xl',centered:true,windowClass:'otp-history-modal'});this.otpModal=modal;
    const closed=()=>{if(this.otpModal===modal){this.otpRequest?.unsubscribe();this.otpModal=undefined;}};modal.result.then(closed,closed);
    this.loadOtpPage(1);
  }
  loadOtpPage(page=this.otpPage){
    if(!this.otpUser)return;this.otpRequest?.unsubscribe();this.otpLoading=true;this.otpFailed=false;this.otpPage=page;
    const userId=this.otpUser.id;
    this.otpRequest=this.storeuserservice.otpHistory(userId,page,this.otpLimit).pipe(finalize(()=>this.otpLoading=false)).subscribe({next:r=>{if(this.otpUser?.id!==userId)return;this.otpRows=r.data||[];this.otpTotal=r.totalCount||0;this.otpPage=r.currentPage||page;},error:()=>this.otpFailed=true});
  }
  changeOtpLimit(){this.loadOtpPage(1);}
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
      { label: 'Total Store Users', value: this.totalCount || 0 },
      { label: 'Showing', value: this.dataList?.length || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private storeuserservice: StoreuserService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.storeuserservice.getAllStoreadminsByPage(this.page, this.limit, this.searchTxt).pipe(
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
    const modalRef = this.modalService.open(AddUpdateStoreUserComponent, {
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
          this.storeuserservice.deleteStoreuser(id).pipe(
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

  viewStore(id: number) {
    const modalRef = this.modalService.open(ViewStoreDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.id = id;
  }
}
