import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SharedService } from '../../shared/services/shared.service';
import { PaymentSettingService } from './payment-setting.service';
import { PaymentSettingReqModel } from './payment-setting.model';

@Component({
  selector: 'app-payment-setting',
  templateUrl: './payment-setting.component.html',
  styleUrl: './payment-setting.component.scss',
})
export class PaymentSettingComponent implements OnInit {
  isDataLoaded = false;
  isSaving = false;
  showSecret = false;
  paymentsetting: PaymentSettingReqModel = new PaymentSettingReqModel();

  constructor(
    public sharedservice: SharedService,
    private paymentsettingservice: PaymentSettingService
  ) {}

  ngOnInit(): void {
    this.getPaymentSetting();
  }

  private asBool(value: any): boolean {
    return value === true || value === 1 || value === '1';
  }

  getPaymentSetting() {
    this.isDataLoaded = false;
    this.paymentsettingservice.getSiteConfig().subscribe({
      next: (res: any) => {
        const config = res?.data?.[0] || {};
        this.paymentsetting.enableRazorpay = this.asBool(config.enableRazorpay);
        this.paymentsetting.rzp_keyId = config.rzp_keyId || '';
        this.paymentsetting.rzp_keySecret = config.rzp_keySecret || '';
        this.isDataLoaded = true;
      },
      error: () => {
        this.isDataLoaded = true;
        this.sharedservice.showAlert(2, 'Failed to load payment settings');
      },
    });
  }

  onRazorpayToggle(enabled: boolean) {
    this.paymentsetting.enableRazorpay = !!enabled;
    if (!enabled) {
      this.showSecret = false;
    }
  }

  updateSetting() {
    let errTxt = '';

    if (this.paymentsetting.enableRazorpay) {
      if (!String(this.paymentsetting.rzp_keyId || '').trim()) {
        errTxt += 'Enter Razorpay Key ID <br/>';
      }
      if (!String(this.paymentsetting.rzp_keySecret || '').trim()) {
        errTxt += 'Enter Razorpay Key Secret <br/>';
      }
    }

    if (errTxt) {
      this.sharedservice.showAlert(2, errTxt);
      return;
    }

    if (this.isSaving) return;
    this.isSaving = true;
    this.paymentsettingservice
      .updateSiteConfig({
        enableRazorpay: !!this.paymentsetting.enableRazorpay,
        rzp_keyId: String(this.paymentsetting.rzp_keyId || '').trim(),
        rzp_keySecret: String(this.paymentsetting.rzp_keySecret || '').trim(),
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.sharedservice.showAlert(1, 'Payment Setting Updated Successfully');
          } else {
            this.sharedservice.showAlert(2, 'Something Went Wrong');
          }
        },
        error: () => {
          this.sharedservice.showAlert(2, 'Technical Issue Found !');
        },
      });
  }
}
