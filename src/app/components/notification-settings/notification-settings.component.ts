import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedService } from '../../shared/services/shared.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { BoxViewSkeletonComponent } from '../../shared/components/box-view-skeleton/box-view-skeleton.component';
import { NotificationSettingsService } from './notification-settings.service';
import { PushService } from '../../shared/services/push.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [FormsModule, BreadcrumbComponent, BoxViewSkeletonComponent],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
})
export class NotificationSettingsComponent implements OnInit {
  isDataLoaded = false;
  isSavingWeb = false;
  isGeneratingVapid = false;
  isSavingApp = false;
  isSavingKey = false;
  testingId: number | null = null;

  webSettings: any = {
    occasion_auto_enabled: true,
    occasion_send_time_utc: '04:30',
    default_icon_url: '',
    default_click_url: 'https://app.storsee.com',
    vapid_configured: false,
    vapid_public_key: '',
    vapid_subject: 'mailto:support@storsee.com',
  };

  appSettings: any = {
    enabled: false,
    default_icon_url: '',
    default_click_url: 'https://app.storsee.com',
  };
  keys: any[] = [];
  enabledCount = 0;

  showKeyForm = false;
  editingKeyId: number | null = null;
  keyForm = {
    label: '',
    project_id: '',
    service_account_json: '',
    enabled: true,
  };

  constructor(
    public sharedservice: SharedService,
    private settingsService: NotificationSettingsService,
    private pushService: PushService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll() {
    this.isDataLoaded = false;
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.isDataLoaded = true;
    };

    this.settingsService.getWebPushSettings().subscribe({
      next: (res: any) => {
        this.webSettings = {
          occasion_auto_enabled: !!res?.data?.occasion_auto_enabled,
          occasion_send_time_utc: res?.data?.occasion_send_time_utc || '04:30',
          default_icon_url: res?.data?.default_icon_url || '',
          default_click_url: res?.data?.default_click_url || 'https://app.storsee.com',
          vapid_configured: !!res?.data?.vapid_configured,
          vapid_public_key: res?.data?.vapid_public_key || '',
          vapid_subject: res?.data?.vapid_subject || 'mailto:support@storsee.com',
        };
        done();
      },
      error: () => {
        this.sharedservice.showAlert(2, 'Failed to load web push settings');
        done();
      },
    });

    this.settingsService.getAppPushSettings().subscribe({
      next: (res: any) => {
        this.appSettings = {
          enabled: !!res?.data?.settings?.enabled,
          default_icon_url: res?.data?.settings?.default_icon_url || '',
          default_click_url: res?.data?.settings?.default_click_url || 'https://app.storsee.com',
        };
        this.keys = res?.data?.keys || [];
        this.enabledCount = Number(res?.data?.enabled_keys_count || 0);
        done();
      },
      error: () => {
        this.sharedservice.showAlert(2, 'Failed to load app push settings');
        done();
      },
    });
  }

  saveWebDefaults() {
    this.isSavingWeb = true;
    this.settingsService
      .updateWebPushSettings({
        occasion_auto_enabled: !!this.webSettings.occasion_auto_enabled,
        occasion_send_time_utc: this.webSettings.occasion_send_time_utc,
        default_click_url: String(this.webSettings.default_click_url || '').trim(),
        default_icon_url: String(this.webSettings.default_icon_url || '').trim() || null,
        vapid_subject: String(this.webSettings.vapid_subject || '').trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingWeb = false;
          this.sharedservice.showAlert(1, 'Web push settings saved');
          this.loadAll();
        },
        error: (e) => {
          this.isSavingWeb = false;
          this.sharedservice.showAlert(2, e?.error?.message || 'Failed to save web push settings');
        },
      });
  }

  generateVapid() {
    this.isGeneratingVapid = true;
    this.settingsService.generateVapidKeys(this.webSettings.vapid_subject).subscribe({
      next: () => {
        this.isGeneratingVapid = false;
        this.sharedservice.showAlert(1, 'VAPID keys generated & saved');
        this.loadAll();
      },
      error: (e) => {
        this.isGeneratingVapid = false;
        this.sharedservice.showAlert(2, e?.error?.message || 'Failed to generate VAPID keys');
      },
    });
  }

  enableBrowserPush() {
    void this.pushService.enable();
  }

  onAppEnabledToggle(event: Event) {
    const checked = !!(event.target as HTMLInputElement).checked;
    this.appSettings.enabled = checked;
    this.isSavingApp = true;
    this.settingsService.updateAppPushSettings({ enabled: checked }).subscribe({
      next: () => {
        this.isSavingApp = false;
        this.sharedservice.showAlert(1, 'App push settings saved');
        this.loadAll();
      },
      error: (e) => {
        this.isSavingApp = false;
        this.sharedservice.showAlert(2, e?.error?.message || 'Failed to update app push');
        this.loadAll();
      },
    });
  }

  saveAppDefaults() {
    this.isSavingApp = true;
    this.settingsService
      .updateAppPushSettings({
        default_click_url: String(this.appSettings.default_click_url || '').trim(),
        default_icon_url: String(this.appSettings.default_icon_url || '').trim() || null,
      })
      .subscribe({
        next: () => {
          this.isSavingApp = false;
          this.sharedservice.showAlert(1, 'App push defaults saved');
          this.loadAll();
        },
        error: (e) => {
          this.isSavingApp = false;
          this.sharedservice.showAlert(2, e?.error?.message || 'Failed to save defaults');
        },
      });
  }

  openAddKey() {
    this.editingKeyId = null;
    this.keyForm = { label: '', project_id: '', service_account_json: '', enabled: true };
    this.showKeyForm = true;
  }

  openEditKey(key: any) {
    this.editingKeyId = key.id;
    this.keyForm = {
      label: key.label || '',
      project_id: key.project_id || '',
      service_account_json: '',
      enabled: !!key.enabled,
    };
    this.showKeyForm = true;
  }

  cancelKeyForm() {
    this.showKeyForm = false;
    this.editingKeyId = null;
    this.keyForm = { label: '', project_id: '', service_account_json: '', enabled: true };
  }

  onJsonFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.keyForm.service_account_json = String(reader.result || '');
      try {
        const parsed = JSON.parse(this.keyForm.service_account_json);
        if (!this.keyForm.project_id && parsed.project_id) {
          this.keyForm.project_id = parsed.project_id;
        }
        if (!this.keyForm.label) {
          this.keyForm.label = parsed.project_id || file.name;
        }
      } catch {
        /* ignore */
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  saveKey() {
    let err = '';
    if (!String(this.keyForm.label || '').trim()) err += 'Enter a label<br/>';
    if (!this.editingKeyId && !String(this.keyForm.service_account_json || '').trim()) {
      err += 'Paste or upload service account JSON<br/>';
    }
    if (err) {
      this.sharedservice.showAlert(2, err);
      return;
    }

    const payload: any = {
      label: String(this.keyForm.label).trim(),
      project_id: String(this.keyForm.project_id || '').trim(),
      enabled: !!this.keyForm.enabled,
    };
    const json = String(this.keyForm.service_account_json || '').trim();
    if (json) payload.service_account_json = json;

    this.isSavingKey = true;
    const req$ = this.editingKeyId
      ? this.settingsService.updateKey(this.editingKeyId, payload)
      : this.settingsService.createKey(payload);

    req$.subscribe({
      next: () => {
        this.isSavingKey = false;
        this.sharedservice.showAlert(1, 'Firebase credential saved');
        this.cancelKeyForm();
        this.loadAll();
      },
      error: (e) => {
        this.isSavingKey = false;
        this.sharedservice.showAlert(2, e?.error?.message || 'Failed to save credential');
      },
    });
  }

  onKeyToggle(key: any, event: Event) {
    const checked = !!(event.target as HTMLInputElement).checked;
    this.settingsService.updateKeyStatus(key.id, checked).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Status updated');
        this.loadAll();
      },
      error: (e) => {
        this.sharedservice.showAlert(2, e?.error?.message || 'Failed to update status');
        this.loadAll();
      },
    });
  }

  deleteKey(key: any) {
    if (!confirm(`Delete Firebase credential "${key.label}"?`)) return;
    this.settingsService.deleteKey(key.id).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Credential deleted');
        this.loadAll();
      },
      error: (e) => this.sharedservice.showAlert(2, e?.error?.message || 'Failed to delete'),
    });
  }

  testKey(key: any) {
    this.testingId = key.id;
    this.settingsService.testKey(key.id).subscribe({
      next: () => {
        this.testingId = null;
        this.sharedservice.showAlert(1, 'Firebase credential OK');
        this.loadAll();
      },
      error: (e) => {
        this.testingId = null;
        this.sharedservice.showAlert(2, e?.error?.message || 'Firebase test failed');
        this.loadAll();
      },
    });
  }
}
