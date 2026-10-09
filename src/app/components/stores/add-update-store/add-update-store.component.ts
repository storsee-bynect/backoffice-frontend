import { Component, Input, OnInit } from '@angular/core';
import { IndustriesService } from '../../industries/industries.service';
import { finalize } from 'rxjs/operators';
import { StoreReqModel } from '../stores.model';
import { SharedService } from '../../../shared/services/shared.service';
import { StoreService } from '../stores.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateService } from '../../templates/templates.service';
import { PackageService } from '../../packages/packages.service';
import { COUNTRY_CODES, DEFAULT_COUNTRY_DIAL, isValidLocalPhone, normalizeLocalPhone, phoneMaxLength } from '../../../shared/constant/country-codes';

@Component({
  selector: 'app-add-update-store',
  templateUrl: './add-update-store.component.html',
  styleUrls: ['./add-update-store.component.scss']
})
export class AddUpdateStoreComponent implements OnInit {
  @Input() isEdit;
  @Input() data;
  templateList : any[] = [];
  industryList: any[] = [];
  industriesLoading = false;
  industriesError = false;
  packageList : any[] = [];
  dataReqModel: StoreReqModel = new StoreReqModel();

  selectedPackage : any = null;
  useCustomLimits = false;
  isSaving = false;
  readonly countryCodes = COUNTRY_CODES;

  get phoneMaxLen(): number {
    return phoneMaxLength(this.dataReqModel.countryCode);
  }

  constructor(public sharedservice: SharedService, private storeservice: StoreService, private packageservice: PackageService, private templateservice: TemplateService, public activeModal: NgbActiveModal, private industries: IndustriesService) { }

  ngOnInit(): void {
    this.dataReqModel.ip = this.sharedservice.ip;
    this.getTemplateList();
    this.getPackageList();
    this.loadIndustries();
    if (this.data) {
      this.isEdit = true;
      this.dataReqModel.email = this.data.email;
      this.dataReqModel.expireDate = this.data.expireDate;
      this.dataReqModel.isActive = this.data.isActive;
      this.dataReqModel.lastRenew = this.data.lastRenew;
      this.dataReqModel.name = this.data.name;
      this.dataReqModel.phone = this.data.phone;
      this.dataReqModel.countryCode = this.data.countryCode || DEFAULT_COUNTRY_DIAL;
      this.dataReqModel.selectedTemplate = this.data.selectedTemplate;
      this.dataReqModel.sessions = this.data.sessions;
      this.dataReqModel.slug = this.data.slug;
      this.dataReqModel.type = this.data.type;
      this.dataReqModel.industryId = Number(this.data.industryId) || null;
      this.dataReqModel.activePackageId = this.data.activePackageId;
      this.dataReqModel.productLimit = this.data.productLimit ?? 0;
      this.dataReqModel.maxOrders = this.data.maxOrders ?? 0;
    }
  }

  loadIndustries(): void {
    this.industriesLoading = true;
    this.industriesError = false;
    this.industries.active().pipe(finalize(() => this.industriesLoading = false)).subscribe({
      next: (res) => {
        this.industryList = res.data || [];
        const id = Number(this.data?.industryId);
        if (id && !this.industryList.some((item) => Number(item.id) === id)) {
          this.industryList.push({ id, name: this.data.industryName || 'Current industry', inactive: true });
        }
      },
      error: () => this.industriesError = true,
    });
  }

  getTemplateList(){
    this.templateservice.getTemplateList().subscribe((res : any) => {
      if(res){
        this.templateList = (res.data || []).filter((t: any) => t.isActive !== 0 && t.isActive !== false);
      }
    })
  }
  getPackageList(){
    this.packageservice.getPackageList().subscribe((res : any) => {
      if(res){
        this.packageList = (res.data || []).filter((p: any) => p.isActive !== 0 && p.isActive !== false);
        if (!this.isEdit && this.packageList.length && !this.selectedPackage) {
          this.selectedPackage = this.packageList.find((p: any) => p.isRecommended) || this.packageList.find((p: any) => p.isPopular) || this.packageList[0];
          this.applyPackageDefaults();
        }
      }
    })
  }

  onPackageChange() {
    if (!this.useCustomLimits) {
      this.applyPackageDefaults();
    }
  }

  applyPackageDefaults() {
    if (!this.selectedPackage) return;
    this.dataReqModel.activePackageId = this.selectedPackage.id;
    if (!this.useCustomLimits) {
      this.dataReqModel.productLimit = this.selectedPackage.productLimit ?? 0;
      this.dataReqModel.maxOrders = this.selectedPackage.maxOrders ?? 0;
    }
  }

  limitLabel(value: number): string {
    return value === 0 || value === null ? 'Unlimited' : String(value);
  }

  normalizeSlug(): void {
    if (this.dataReqModel.slug) {
      this.dataReqModel.slug = String(this.dataReqModel.slug).trim().toLowerCase().replace(/\s+/g, '-');
    }
  }

  validateData() {
    let errTxt = '';
    if (!this.isEdit && !this.dataReqModel.industryId) errTxt += 'Select Industry <br/>';

    if (!this.dataReqModel.name) {
      errTxt += 'Enter Name <br/>'
    }
    if (!this.dataReqModel.selectedTemplate) {
      errTxt += 'Select Template <br/>'
    }
    if (!this.dataReqModel.type) {
      errTxt += 'Select Business Type <br/>'
    }
    if (!this.dataReqModel.slug) {
      errTxt += 'Enter Slug <br/>'
    } else {
      this.normalizeSlug();
      if (this.dataReqModel.slug.length < 4) {
        errTxt += 'Store URL must be at least 4 characters <br/>'
      }
      if (!/^[a-z0-9-]+$/.test(this.dataReqModel.slug)) {
        errTxt += 'Store URL can only contain lowercase letters, numbers, and hyphens <br/>'
      }
    }
    if (!this.dataReqModel.email) {
      errTxt += 'Enter Email <br/>'
    }else{
      if (String(this.dataReqModel.email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) { } else {
        errTxt += 'Enter Valid Email<br/>'
      }
    }
    if (!this.dataReqModel.phone) {
      errTxt += 'Enter Phone <br/>'
    } else if (!isValidLocalPhone(this.dataReqModel.phone, this.dataReqModel.countryCode)) {
      errTxt += this.dataReqModel.countryCode === '91'
        ? 'Enter Valid 10-digit Phone <br/>'
        : 'Enter Valid Phone <br/>';
    }
    if (!this.isEdit) {
      if (!this.selectedPackage) {
        errTxt += 'Select Package <br/>';
      } else {
        this.dataReqModel.expireDate = this.getStoreExpireDate(this.selectedPackage.duration);
        this.dataReqModel.lastRenew = this.getStoreRenewDate();
        this.applyPackageDefaults();
      }
      if (this.dataReqModel.createStoreLogin && !this.dataReqModel.adminPassword) {
        errTxt += 'Enter dashboard login password <br/>';
      }
      if (this.dataReqModel.createStoreLogin && this.dataReqModel.adminPassword && this.dataReqModel.adminPassword.length < 4) {
        errTxt += 'Password must be at least 4 characters <br/>';
      }
    }

    if (errTxt == '') {
      this.dataReqModel.type = Number(this.dataReqModel.type);
      this.dataReqModel.email = String(this.dataReqModel.email).trim().toLowerCase();
      this.dataReqModel.countryCode = this.dataReqModel.countryCode || DEFAULT_COUNTRY_DIAL;
      this.dataReqModel.phone = normalizeLocalPhone(this.dataReqModel.phone, this.dataReqModel.countryCode);
      if (!this.isEdit) {
        this.dataReqModel.adminName = this.dataReqModel.adminName || this.dataReqModel.name;
      }
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

    const payload: any = { ...this.dataReqModel };
    if (this.dataReqModel.createStoreLogin) {
      payload.adminPassword = this.dataReqModel.adminPassword;
      payload.adminName = this.dataReqModel.adminName || this.dataReqModel.name;
    } else {
      delete payload.adminPassword;
      delete payload.adminName;
    }
    delete payload.createStoreLogin;

    this.storeservice.addStore(payload).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe((res: any) => {
      if (res) {
        const adminMsg = res.storeAdmin ? ' Store login created.' : '';
        this.sharedservice.showAlert(1, 'Store created successfully.' + adminMsg);
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

    this.storeservice.updateStore(this.data.id, this.dataReqModel).subscribe((res: any) => {
      if (res) {
        this.storeservice.updateStoreLimits(this.data.id, {
          productLimit: Number(this.dataReqModel.productLimit) || 0,
          maxOrders: Number(this.dataReqModel.maxOrders) || 0,
        }).pipe(
          finalize(() => this.isSaving = false)
        ).subscribe({
          next: () => {
            this.sharedservice.showAlert(1, 'Data Updated Successfully');
            this.activeModal.close(true);
          },
          error: () => {
            this.sharedservice.showAlert(1, 'Store updated; limits may need retry');
            this.activeModal.close(true);
          }
        });
      } else {
        this.isSaving = false;
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    }, err => {
      this.isSaving = false;
      if(err.status == 401){
        this.activeModal.close();
      }else{
        this.sharedservice.showAlert(2, err.error?.error || 'Something Went Wrong');
      }
    })
  }

  getStoreExpireDate(x) {
    const durationDays = Number(x || 0);

    const now = new Date();
    const baseUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));

    if (!isNaN(durationDays) && durationDays > 0) {
      baseUtc.setUTCDate(baseUtc.getUTCDate() + durationDays);
    }

    const year = baseUtc.getUTCFullYear();
    const month = String(baseUtc.getUTCMonth() + 1).padStart(2, '0');
    const day = String(baseUtc.getUTCDate()).padStart(2, '0');
    const hours = String(baseUtc.getUTCHours()).padStart(2, '0');
    const minutes = String(baseUtc.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  getStoreRenewDate() {
    const now = new Date();
    const baseUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));

    const year = baseUtc.getUTCFullYear();
    const month = String(baseUtc.getUTCMonth() + 1).padStart(2, '0');
    const day = String(baseUtc.getUTCDate()).padStart(2, '0');
    const hours = String(baseUtc.getUTCHours()).padStart(2, '0');
    const minutes = String(baseUtc.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
