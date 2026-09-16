import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PackageReqModel } from '../packages.model';
import { SharedService } from '../../../shared/services/shared.service';
import { PackageService } from '../packages.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-update-package',
  templateUrl: './add-update-package.component.html',
  styleUrls: ['./add-update-package.component.scss']
})
export class AddUpdatePackageComponent {
  @Input() isEdit: boolean = false;
  @Input() data: any;

  dataReqModel: PackageReqModel = new PackageReqModel();
  benefits: any[] = [];
  isSaving = false;
  enableIntroPricing = false;

  constructor(
    public sharedservice: SharedService,
    private packageservice: PackageService,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      this.dataReqModel.slug = this.data.slug || '';
      this.dataReqModel.tierSlug = this.data.tierSlug || 'starter';
      this.dataReqModel.billingCycle = this.data.billingCycle || 'monthly';
      this.dataReqModel.billingLabel = this.data.billingLabel || '1 Month';
      this.dataReqModel.name = this.data.name;
      this.dataReqModel.tagline = this.data.tagline || '';
      this.dataReqModel.description = this.data.description || '';
      this.dataReqModel.amount = this.data.amount;
      this.dataReqModel.introMonths = Number(this.data.introMonths || 0);
      this.dataReqModel.introAmount = Number(this.data.introAmount || 0);
      this.enableIntroPricing = this.dataReqModel.introMonths > 0;
      this.dataReqModel.duration = this.data.duration;
      this.dataReqModel.productLimit = this.data.productLimit;
      this.dataReqModel.maxOrders = this.data.maxOrders || 0;
      this.dataReqModel.trialDays = this.data.trialDays || 0;
      this.dataReqModel.color = this.data.color || '#1d68f1';
      this.dataReqModel.sortOrder = this.data.sortOrder ?? 0;
      this.dataReqModel.isPopular = !!this.data.isPopular;
      this.dataReqModel.isRecommended = !!this.data.isRecommended;
      this.dataReqModel.isActive = this.data.isActive !== undefined ? !!this.data.isActive : true;
      this.dataReqModel.features = this.data.features || '{}';
      try {
        this.benefits = JSON.parse(this.data.benefits) || [];
      } catch {
        this.benefits = [];
      }
    } else {
      this.benefits.push({ text: '' });
      this.onBillingCycleChange();
    }
  }

  onIntroToggle() {
    if (!this.enableIntroPricing) {
      this.dataReqModel.introMonths = 0;
      this.dataReqModel.introAmount = 0;
    } else if (!this.dataReqModel.introMonths) {
      this.dataReqModel.introMonths = 1;
    }
  }

  onBillingCycleChange() {
    const map: Record<string, { label: string; days: number }> = {
      trial: { label: '3-Day Trial', days: 3 },
      '1m': { label: '1 Month', days: 30 },
      '3m': { label: '3 Months', days: 90 },
      '6m': { label: '6 Months', days: 180 },
      '12m': { label: '12 Months', days: 365 },
      '24m': { label: '24 Months', days: 730 },
      '48m': { label: '48 Months', days: 1460 },
    };
    const c = map[this.dataReqModel.billingCycle] || map['1m'];
    this.dataReqModel.billingLabel = c.label;
    this.dataReqModel.duration = c.days;
    this.syncSlugFromTierCycle();
  }

  syncSlugFromTierCycle() {
    if (this.isEdit) return;
    const tier = (this.dataReqModel.tierSlug || 'storsee').toLowerCase();
    const cycle = (this.dataReqModel.billingCycle || '1m').toLowerCase();
    if (tier === 'basic' || cycle === 'trial') {
      this.dataReqModel.slug = 'basic';
    } else {
      this.dataReqModel.slug = `plan-${cycle}`;
    }
  }

  deleteBenefit(index: number) {
    this.benefits.splice(index, 1);
  }

  autoSlug() {
    if (!this.isEdit && this.dataReqModel.name && !this.dataReqModel.slug) {
      this.dataReqModel.slug = this.dataReqModel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  }

  validateData() {
    let errTxt = '';

    if (!this.dataReqModel.slug?.trim()) errTxt += 'Enter Plan Slug (e.g. starter) <br/>';
    if (!this.dataReqModel.name?.trim()) errTxt += 'Enter Plan Name <br/>';
    if (this.dataReqModel.amount == null || this.dataReqModel.amount === undefined) errTxt += 'Enter Amount <br/>';
    if (!this.dataReqModel.duration) errTxt += 'Enter Duration <br/>';
    if (this.dataReqModel.productLimit == null || this.dataReqModel.productLimit === undefined) errTxt += 'Enter Product Limit <br/>';
    if (this.benefits.length === 0 || this.benefits.every(b => !b.text?.trim())) errTxt += 'Add at least one Benefit <br/>';

    if (this.enableIntroPricing) {
      if (!this.dataReqModel.introMonths || this.dataReqModel.introMonths < 1) {
        errTxt += 'Enter intro months (at least 1) <br/>';
      }
      if (this.dataReqModel.introAmount == null || this.dataReqModel.introAmount === undefined) {
        errTxt += 'Enter intro price <br/>';
      }
    } else {
      this.dataReqModel.introMonths = 0;
      this.dataReqModel.introAmount = 0;
    }

    if (errTxt === '') {
      this.dataReqModel.benefits = JSON.stringify(this.benefits.filter(b => b.text?.trim()));
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
    this.packageservice.addPackage(this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe((res: any) => {
      if (res) {
        this.sharedservice.showAlert(1, 'Plan Created Successfully');
        this.activeModal.close(true);
      } else {
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    }, err => {
      if (err.status === 401) { this.activeModal.close(); }
      else { this.sharedservice.showAlert(2, 'Something Went Wrong'); }
    });
  }

  updateData() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.packageservice.updatePackage(this.data.id, this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe((res: any) => {
      if (res) {
        this.sharedservice.showAlert(1, 'Plan Updated Successfully');
        this.activeModal.close(true);
      } else {
        this.sharedservice.showAlert(2, 'Something Went Wrong');
      }
    }, err => {
      if (err.status === 401) { this.activeModal.close(); }
      else { this.sharedservice.showAlert(2, 'Something Went Wrong'); }
    });
  }
}
