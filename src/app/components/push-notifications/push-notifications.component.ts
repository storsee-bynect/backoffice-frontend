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
import { PushNotificationsService } from './push-notifications.service';
import { AddUpdatePushCampaignComponent } from './add-update-push-campaign/add-update-push-campaign.component';
import { PushCampaignReportComponent } from './push-campaign-report/push-campaign-report.component';
import { formatIst, istHmToUtcHm, utcHmToIstHm } from '../../shared/utils/ist-time.util';

@Component({
  selector: 'app-push-notifications',
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
  templateUrl: './push-notifications.component.html',
  styleUrl: './push-notifications.component.scss'
})
export class PushNotificationsComponent implements OnInit {
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
    occasion_send_time_utc: '04:30',
    default_icon_url: '',
    default_click_url: 'https://app.storsee.com',
    vapid_configured: false,
    vapid_public_key: ''
  };

  constructor(
    public sharedservice: SharedService,
    private dataservice: PushNotificationsService,
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
    const modalRef = this.modalService.open(AddUpdatePushCampaignComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isEdit;
    if (data) modalRef.componentInstance.data = data;
    modalRef.result.then((result) => { if (result) this.getDataList(); }).catch(() => {});
  }

  openReport(item: any) {
    const modalRef = this.modalService.open(PushCampaignReportComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.campaignId = item.id;
  }

  sendNow(item: any) {
    this.dataservice.sendNow(item.id).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Campaign send started');
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

  loadSettings() {
    this.dataservice.getSettings().subscribe({
      next: (res: any) => {
        const d = res?.data || {};
        this.settings = {
          occasion_auto_enabled: !!d.occasion_auto_enabled,
          occasion_send_time_utc: utcHmToIstHm(d.occasion_send_time_utc || '04:30') || '10:00',
          default_icon_url: d.default_icon_url || '',
          default_click_url: d.default_click_url || 'https://app.storsee.com',
          vapid_configured: !!d.vapid_configured,
          vapid_public_key: d.vapid_public_key || ''
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
    this.dataservice.updateSettings({
      occasion_auto_enabled: this.settings.occasion_auto_enabled,
      occasion_send_time_utc: istHmToUtcHm(this.settings.occasion_send_time_utc) || '04:30',
      default_icon_url: this.faviconUrl || this.settings.default_icon_url || null,
      default_click_url: this.settings.default_click_url
    }).subscribe({
      next: (res: any) => {
        this.settingsSaving = false;
        if (res?.data) {
          this.settings.occasion_auto_enabled = !!res.data.occasion_auto_enabled;
          this.settings.occasion_send_time_utc = utcHmToIstHm(res.data.occasion_send_time_utc) || this.settings.occasion_send_time_utc;
          this.settings.default_icon_url = res.data.default_icon_url || '';
          this.settings.default_click_url = res.data.default_click_url;
        }
        this.sharedservice.showAlert(1, 'Settings saved');
      },
      error: (err) => {
        this.settingsSaving = false;
        this.sharedservice.showAlert(2, err?.error?.message || 'Could not save settings');
      }
    });
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

  get faviconUrl(): string {
    return String(this.sharedservice.siteConfig?.icon || '').trim();
  }

  formatIst(value: any): string {
    return formatIst(value);
  }
}
