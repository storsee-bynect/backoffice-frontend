import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { SharedService } from '../../../shared/services/shared.service';
import { NotificationSettingsService } from '../../notification-settings/notification-settings.service';
import { AppNotificationsService } from '../app-notifications.service';
import {
  istDateEndToUtcIso,
  istDateStartToUtcIso,
  istDateTimeLocalToUtcIso,
  istHmToUtcHm,
  utcHmToIstHm,
  utcToIstDate,
  utcToIstDateTimeLocal
} from '../../../shared/utils/ist-time.util';

@Component({
  selector: 'app-add-update-app-notification',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-update-app-notification.component.html',
  styleUrl: '../../push-notifications/add-update-push-campaign/add-update-push-campaign.component.scss'
})
export class AddUpdateAppNotificationComponent implements OnInit {
  @Input() isEdit = false;
  @Input() data: any;

  saving = false;
  testing = false;

  title = '';
  body = '';
  audience: 'all' | 'active_plan' | 'inactive_plan' = 'all';
  send_mode: 'instant' | 'once' | 'daily' = 'instant';
  status: 'draft' | 'scheduled' = 'draft';
  start_at = '';
  end_at = '';
  onceSlots: string[] = [''];
  dailyTimes: string[] = ['10:00'];

  defaultClickUrl = 'https://app.storsee.com';

  readonly audiences = [
    { value: 'all' as const, label: 'All app users', hint: 'Everyone with APK notifications on' },
    { value: 'active_plan' as const, label: 'Active plan', hint: 'Paid or free plan still valid' },
    { value: 'inactive_plan' as const, label: 'Inactive plan', hint: 'No active plan' }
  ];

  readonly sendModes = [
    { value: 'instant' as const, label: 'Instant', hint: 'Send as soon as you save as Scheduled' },
    { value: 'once' as const, label: 'Once', hint: 'One or more date and times' },
    { value: 'daily' as const, label: 'Daily', hint: 'Repeat at chosen times' }
  ];

  constructor(
    public sharedservice: SharedService,
    public activeModal: NgbActiveModal,
    private dataservice: AppNotificationsService,
    private appPushSettings: NotificationSettingsService
  ) {}

  ngOnInit(): void {
    void this.loadDefaults();
    if (this.data) {
      this.isEdit = true;
      this.title = this.data.title || '';
      this.body = this.data.body || '';
      this.audience = this.data.audience || 'all';
      this.send_mode = this.data.send_mode || 'instant';
      this.status = this.data.status === 'draft' ? 'draft' : 'scheduled';
      this.start_at = utcToIstDate(this.data.start_at);
      this.end_at = utcToIstDate(this.data.end_at);
      const times = this.data.schedule_times || [];
      if (this.send_mode === 'once') {
        this.onceSlots = times.length ? times.map((t: string) => utcToIstDateTimeLocal(t)) : [''];
      }
      if (this.send_mode === 'daily') {
        this.dailyTimes = times.length ? times.map((t: string) => utcHmToIstHm(t) || t) : ['10:00'];
      }
    }
  }

  private async loadDefaults(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.appPushSettings.getAppPushSettings());
      this.defaultClickUrl = res?.data?.settings?.default_click_url || 'https://app.storsee.com';
    } catch {}
  }

  get faviconUrl(): string {
    return String(this.sharedservice.siteConfig?.icon || '').trim();
  }

  addOnceSlot() { this.onceSlots.push(''); }
  removeOnceSlot(i: number) { this.onceSlots.splice(i, 1); if (!this.onceSlots.length) this.onceSlots = ['']; }
  addDailyTime() { this.dailyTimes.push('10:00'); }
  removeDailyTime(i: number) { this.dailyTimes.splice(i, 1); if (!this.dailyTimes.length) this.dailyTimes = ['10:00']; }

  validateData() {
    let errTxt = '';
    if (!this.title.trim()) errTxt += 'Enter Title <br/>';
    if (!this.body.trim()) errTxt += 'Enter Body <br/>';
    if (this.send_mode === 'once' && this.status === 'scheduled' && !this.onceSlots.filter(Boolean).length) {
      errTxt += 'Add at least one date and time <br/>';
    }
    if (this.send_mode === 'daily' && this.status === 'scheduled' && !this.dailyTimes.filter(Boolean).length) {
      errTxt += 'Add at least one time <br/>';
    }
    if (errTxt) {
      this.sharedservice.showAlert(2, errTxt);
      return;
    }
    this.save();
  }

  payload() {
    let schedule_times: string[] = [];
    if (this.send_mode === 'once') {
      schedule_times = this.onceSlots.map((slot) => istDateTimeLocalToUtcIso(slot)).filter((v): v is string => !!v);
    } else if (this.send_mode === 'daily') {
      schedule_times = this.dailyTimes.map((t) => istHmToUtcHm(t)).filter((v): v is string => !!v);
    }
    return {
      title: this.title.trim(),
      body: this.body.trim(),
      icon_url: this.faviconUrl || null,
      image_url: null,
      click_url: this.defaultClickUrl,
      audience: this.audience,
      send_mode: this.send_mode,
      schedule_times,
      start_at: this.send_mode === 'daily' && this.start_at ? istDateStartToUtcIso(this.start_at) : null,
      end_at: this.send_mode === 'daily' && this.end_at ? istDateEndToUtcIso(this.end_at) : null,
      status: this.status
    };
  }

  save() {
    this.saving = true;
    const body = this.payload();
    const req = this.isEdit && this.data?.id
      ? this.dataservice.update(this.data.id, body)
      : this.dataservice.create(body);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.sharedservice.showAlert(1, this.isEdit ? 'Data Updated Successfully' : 'Data Added Successfully');
        this.activeModal.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.sharedservice.showAlert(2, err?.error?.message || 'Something Went Wrong');
      }
    });
  }

  testSend() {
    if (!this.data?.id) {
      this.sharedservice.showAlert(2, 'Save the campaign before sending a test');
      return;
    }
    this.testing = true;
    this.dataservice.test(this.data.id).subscribe({
      next: () => {
        this.testing = false;
        this.sharedservice.showAlert(1, 'Test app notification sent');
      },
      error: (err) => {
        this.testing = false;
        this.sharedservice.showAlert(2, err?.error?.message || 'Could not send test');
      }
    });
  }
}
