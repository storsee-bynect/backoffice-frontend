import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { StoreuserService } from '../../store-users/store-users.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { AddUpdateStoreUserComponent } from '../../store-users/add-update-store-user/add-update-store-user.component';
import { DeleteConfirmationComponent } from '../../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-store-users-list',
  templateUrl: './store-users-list.component.html',
  styleUrl: './store-users-list.component.scss'
})
export class StoreUsersListComponent implements OnInit{
  limit : number = 10;
  page: number = 1;
  @Input() storeId;
  usersList : any[] = [];
  isLoading = true;
  loadFailed = false;

  constructor(
    private storeuserservice: StoreuserService,
    public activeModal: NgbActiveModal,
    public sharedservice: SharedService,
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.getUsersByStoreId();
  }

  getUsersByStoreId(){
    this.isLoading = true;
    this.loadFailed = false;
    this.storeuserservice.getStoreusersByStoreId(this.storeId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe((res : any) => {
      if(res){
        this.usersList = res.data || [];
      }
    }, err => {
      this.loadFailed = true;
      if(err.status == 401){
        this.activeModal.close();
      }else{
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    })
  }

  addUpdateData(isEdit: boolean, data?) {
    const modalRef = this.modalService.open(AddUpdateStoreUserComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isEdit;
    if (data) {
      modalRef.componentInstance.data = data;
    } else {
      modalRef.componentInstance.presetStoreId = this.storeId;
    }
    modalRef.result.then(result => {
      if (result) {
        this.getUsersByStoreId();
      }
    }).catch(() => {});
  }

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });
    modalRef.result.then(result => {
      if (result && id) {
        this.storeuserservice.deleteStoreuser(id).subscribe(res => {
          if (res) {
            this.sharedservice.showAlert(1, 'Deleted Successfully');
            this.getUsersByStoreId();
          }
        }, err => {
          this.sharedservice.showAlert(2, err.error?.error || 'Something Went Wrong');
        });
      }
    }).catch(() => {});
  }
}
