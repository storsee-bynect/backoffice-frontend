import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { StoreUserReqModel } from '../store-users.model';
import { SharedService } from '../../../shared/services/shared.service';
import { StoreuserService } from '../store-users.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreService } from '../../stores/stores.service';

@Component({
  selector: 'app-add-update-store-user',
  templateUrl: './add-update-store-user.component.html',
  styleUrl: './add-update-store-user.component.scss'
})
export class AddUpdateStoreUserComponent {
  @Input() isEdit;
  @Input() data;
  @Input() presetStoreId: number;
  dataReqModel: StoreUserReqModel = new StoreUserReqModel();
  storeList : any[];
  isSaving = false;

  constructor(public sharedservice: SharedService, private storeuserservice: StoreuserService, private storeservice: StoreService, public activeModal: NgbActiveModal) { }

  get isGoogleLinked(): boolean {
    return !!this.data?.googleId;
  }

  get passwordPlaceholder(): string {
    if (!this.isEdit) return 'Enter Password';
    return this.data?.password ? 'Leave blank to keep current password' : 'Not set — enter a password';
  }

  ngOnInit(): void {
    this.getRoles();
    if (this.data) {
      this.isEdit = true;
      this.dataReqModel.email = this.data.email;
      this.dataReqModel.isActive = this.data.isActive;
      this.dataReqModel.mobile = this.data.mobile;
      this.dataReqModel.name = this.data.name;
      this.dataReqModel.password = this.data.password;
      this.dataReqModel.storeId = this.data.storeId;
      this.dataReqModel.ip = this.data.ip;
    } else {
      this.dataReqModel.ip = this.sharedservice.ip;
      if (this.presetStoreId) {
        this.dataReqModel.storeId = Number(this.presetStoreId);
      }
    }
  }

  getRoles(){
    this.storeservice.getStoreList().subscribe((res : any) => {
      if(res){
        this.storeList = res.data;
      }
    })
  }

  validateData() {
    let errTxt = '';

    if (!this.dataReqModel.name) {
      errTxt += 'Enter Name <br/>'
    }
    if (!this.isEdit && !this.dataReqModel.password) {
      errTxt += 'Enter Password <br/>'
    }
    const passwordChanged = this.dataReqModel.password && this.dataReqModel.password !== this.data?.password;
    if (passwordChanged && String(this.dataReqModel.password).length < 6) {
      errTxt += 'Password must be at least 6 characters <br/>'
    }
    if (!this.dataReqModel.email) {
      errTxt += 'Enter Email <br/>'
    }else{
      if (String(this.dataReqModel.email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) { } else {
        errTxt += 'Enter Valid Email<br/>'
      }
    }
    if (!this.dataReqModel.mobile) {
      errTxt += 'Enter Mobile <br/>'
    }else{
      if(String(this.dataReqModel.mobile).length != 10){
        errTxt += 'Enter Valid Mobile <br/>'
      }
    }
    if (!this.dataReqModel.storeId) {
      errTxt += 'Select Store <br/>'
    }
     
    if (errTxt == '') {
      this.dataReqModel.storeId = Number(this.dataReqModel.storeId);
      this.dataReqModel.mobile = String(this.dataReqModel.mobile);
      this.dataReqModel.isActive = true;
      if (this.isEdit) {
        this.updateData();
      } else {
        this.addData();
      }
    } else {
      this.sharedservice.showAlert(2, errTxt);
    }
  }

  addData() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.storeuserservice.addStoreuser(this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe((res: any) => {
      if (res) {
        this.sharedservice.showAlert(1, 'Data Added Successfully');
        this.activeModal.close(true);
      } else {
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    }, err => {
      if(err.status == 401){
        this.activeModal.close();
      }else{
        this.sharedservice.showAlert(2, err.error?.error || 'Something Went Wrong');
      }
    })
  }
  updateData() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.storeuserservice.updateStoreuser(this.data.id, this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe((res: any) => {
      if (res) {
        this.sharedservice.showAlert(1, 'Data Updated Successfully');
        this.activeModal.close(true);
      } else {
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    }, err => {
      if(err.status == 401){
        this.activeModal.close();
      }else{
        this.sharedservice.showAlert(2, err.error?.error || 'Something Went Wrong');
      }
    })
  }
}