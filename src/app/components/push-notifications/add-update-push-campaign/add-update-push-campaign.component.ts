import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { SharedService } from '../../../shared/services/shared.service';
import { FileUploadService } from '../../../shared/components/file-upload/file-upload.service';
import { PushNotificationsService } from '../push-notifications.service';
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
  selector: 'app-add-update-push-campaign',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-update-push-campaign.component.html',
  styleUrl: './add-update-push-campaign.component.scss'
})
export class AddUpdatePushCampaignComponent implements OnInit {
  @Input() isEdit = false;
  @Input() data: any;

  saving = false;
  testing = false;
  uploadingImage = false;

  title = '';
  body = '';
  image_url = '';
  click_url = 'https://app.storsee.com';
  audience: 'all' | 'active_plan' | 'inactive_plan' = 'all';
  send_mode: 'instant' | 'once' | 'daily' = 'instant';
  status: 'draft' | 'scheduled' = 'draft';
  start_at = '';
  end_at = '';
  onceSlots: string[] = [''];
  dailyTimes: string[] = ['10:00'];

  readonly audiences: Array<{ value: 'all' | 'active_plan' | 'inactive_plan'; label: string; hint: string }> = [
    { value: 'all', label: 'All customers', hint: 'Everyone with push on' },
    { value: 'active_plan', label: 'Active plan', hint: 'Paid or free plan still valid' },
    { value: 'inactive_plan', label: 'Inactive plan', hint: 'No active plan' }
  ];

  readonly sendModes: Array<{ value: 'instant' | 'once' | 'daily'; label: string; hint: string }> = [
    { value: 'instant', label: 'Instant', hint: 'Send as soon as you save as Scheduled' },
    { value: 'once', label: 'Once', hint: 'One or more date and times' },
    { value: 'daily', label: 'Daily', hint: 'Repeat at chosen times' }
  ];

  constructor(
    public sharedservice: SharedService,
    public activeModal: NgbActiveModal,
    private dataservice: PushNotificationsService,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      this.title = this.data.title || '';
      this.body = this.data.body || '';
      this.image_url = this.data.image_url || '';
      this.click_url = this.data.click_url || 'https://app.storsee.com';
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
        this.dailyTimes = times.length
          ? times.map((t: string) => utcHmToIstHm(t) || t)
          : ['10:00'];
      }
    }
  }

  get faviconUrl(): string {
    return String(this.sharedservice.siteConfig?.icon || '').trim();
  }

  addOnceSlot() { this.onceSlots.push(''); }
  removeOnceSlot(i: number) { this.onceSlots.splice(i, 1); if (!this.onceSlots.length) this.onceSlots = ['']; }
  addDailyTime() { this.dailyTimes.push('10:00'); }
  removeDailyTime(i: number) { this.dailyTimes.splice(i, 1); if (!this.dailyTimes.length) this.dailyTimes = ['10:00']; }

  async onImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingImage = true;
    try {
      const res: any = await firstValueFrom(this.fileUploadService.uploadFile(file, 'push'));
      this.image_url = res?.url || res?.file?.url || res?.data?.url || '';
    } catch {
      this.sharedservice.showAlert(2, 'Could not upload file');
    } finally {
      this.uploadingImage = false;
      input.value = '';
    }
  }

  clearImage() {
    this.image_url = '';
  }

  validateData() {
    let errTxt = '';
    if (!this.title.trim()) errTxt += 'Enter Title <br/>';
    if (!this.body.trim()) errTxt += 'Enter Body <br/>';
    if (!this.click_url.trim()) errTxt += 'Enter Click URL <br/>';
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
      schedule_times = this.onceSlots
        .map((slot) => istDateTimeLocalToUtcIso(slot))
        .filter((v): v is string => !!v);
    } else if (this.send_mode === 'daily') {
      schedule_times = this.dailyTimes
        .map((t) => istHmToUtcHm(t))
        .filter((v): v is string => !!v);
    }

    return {
      title: this.title.trim(),
      body: this.body.trim(),
      icon_url: this.faviconUrl || null,
      image_url: this.image_url || null,
      click_url: this.click_url.trim(),
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
        this.sharedservice.showAlert(1, 'Test notification sent');
      },
      error: (err) => {
        this.testing = false;
        this.sharedservice.showAlert(2, err?.error?.message || 'Could not send test');
      }
    });
  }
}
