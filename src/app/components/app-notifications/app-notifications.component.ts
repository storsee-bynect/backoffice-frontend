import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../shared/services/shared.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { BoxViewSkeletonComponent } from '../../shared/components/box-view-skeleton/box-view-skeleton.component';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { AppNotificationsService } from './app-notifications.service';
import { AddUpdateAppNotificationComponent } from './add-update-app-notification/add-update-app-notification.component';
import { AppNotificationReportComponent } from './app-notification-report/app-notification-report.component';
import { formatIst, istHmToUtcHm, utcHmToIstHm } from '../../shared/utils/ist-time.util';
import { NotificationSettingsService } from '../notification-settings/notification-settings.service';

@Component({
  selector: 'app-app-notifications',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    RouterLink,
    NgxPaginationModule,
    NgbTooltipModule,
    BreadcrumbComponent,
    BoxViewSkeletonComponent
  ],
  templateUrl: './app-notifications.component.html',
  styleUrl: '../push-notifications/push-notifications.component.scss'
})
export class AppNotificationsComponent implements OnInit {
  tab: 'campaigns' | 'settings' = 'campaigns';
  dataList: any[] = [];
  searchTxt = '';
  statusFilter = '';
  page = 1;
  totalCount = 0;
  limit = 10;
  isDataLoaded = false;
  isTechnicalIssue = false;
  settingsLoaded = false;
  settingsSaving = false;
  settings = {
    occasion_auto_enabled: true,
    occasion_send_time_utc: '10:00',
    default_click_url: 'https://app.storsee.com'
  };

  constructor(
    public sharedservice: SharedService,
    private dataservice: AppNotificationsService,
    private appPushSettings: NotificationSettingsService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.getDataList();
    this.loadSettings();
  }

  getDataList() {
    this.dataservice.getAllByPage(this.page, this.limit, this.searchTxt, this.statusFilter).subscribe({
      next: (res: any) => {
        this.dataList = res.data || [];
        this.totalCount = res.totalCount || 0;
        this.isDataLoaded = true;
        this.isTechnicalIssue = false;
      },
      error: () => {
        this.isTechnicalIssue = true;
        this.sharedservice.showAlert(2, 'Technical Issue Found !');
      }
    });
  }

  filterData() {
    this.page = 1;
    this.searchTxt = this.searchTxt.trim();
    this.getDataList();
  }

  addUpdateData(isEdit: boolean, data?: any) {
    const modalRef = this.modalService.open(AddUpdateAppNotificationComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isEdit;
    if (data) modalRef.componentInstance.data = data;
    modalRef.result.then((result) => { if (result) this.getDataList(); }).catch(() => {});
  }

  openReport(item: any) {
    const modalRef = this.modalService.open(AppNotificationReportComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.campaignId = item.id;
  }

  sendNow(item: any) {
    this.dataservice.sendNow(item.id).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'App notification send started');
        this.getDataList();
      },
      error: (err) => this.sharedservice.showAlert(2, err?.error?.message || 'Could not send campaign')
    });
  }

  pauseOrResume(item: any) {
    const next = item.status === 'paused' ? 'scheduled' : 'paused';
    this.dataservice.updateStatus(item.id, next).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, next === 'paused' ? 'Campaign paused' : 'Campaign resumed');
        this.getDataList();
      },
      error: () => this.sharedservice.showAlert(2, 'Could not update status')
    });
  }

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, { size: 'md', centered: true });
    modalRef.result.then((result) => {
      if (result && id) {
        this.dataservice.delete(id).subscribe({
          next: () => {
            this.sharedservice.showAlert(1, 'Deleted Successfully');
            this.getDataList();
          },
          error: () => this.sharedservice.showAlert(2, 'Something Went Wrong')
        });
      }
    }).catch(() => {});
  }

  audienceLabel(value: string): string {
    if (value === 'active_plan') return 'Active plan';
    if (value === 'inactive_plan') return 'Inactive plan';
    return 'All';
  }

  sendModeLabel(value: string): string {
    if (value === 'once') return 'Once';
    if (value === 'daily') return 'Daily';
    return 'Instant';
  }

  statusClass(status: string): string {
    if (status === 'scheduled' || status === 'sending' || status === 'completed') return 'green';
    return 'yellow';
  }

  canPause(item: any): boolean {
    return item.status === 'scheduled' || item.status === 'sending' || item.status === 'paused';
  }

  formatIst(value: any): string {
    return formatIst(value);
  }

  loadSettings() {
    this.appPushSettings.getAppPushSettings().subscribe({
      next: (res: any) => {
        const d = res?.data?.settings || {};
        this.settings = {
          occasion_auto_enabled: !!d.occasion_auto_enabled,
          occasion_send_time_utc: utcHmToIstHm(d.occasion_send_time_utc || '04:30') || '10:00',
          default_click_url: d.default_click_url || 'https://app.storsee.com'
        };
        this.settingsLoaded = true;
      },
      error: () => {
        this.settingsLoaded = true;
      }
    });
  }

  saveSettings() {
    this.settingsSaving = true;
    this.appPushSettings.updateAppPushSettings({
      occasion_auto_enabled: this.settings.occasion_auto_enabled,
      occasion_send_time_utc: istHmToUtcHm(this.settings.occasion_send_time_utc) || '04:30'
    }).subscribe({
      next: (res: any) => {
        this.settingsSaving = false;
        const d = res?.data?.settings || res?.data || {};
        this.settings.occasion_auto_enabled = !!d.occasion_auto_enabled;
        this.settings.occasion_send_time_utc = utcHmToIstHm(d.occasion_send_time_utc) || this.settings.occasion_send_time_utc;
        this.sharedservice.showAlert(1, 'App notification settings saved');
      },
      error: (err) => {
        this.settingsSaving = false;
        this.sharedservice.showAlert(2, err?.error?.message || 'Could not save settings');
      }
    });
  }

  get faviconUrl(): string {
    return String(this.sharedservice.siteConfig?.icon || '').trim();
  }
}
