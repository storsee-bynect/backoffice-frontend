import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { AppNotificationsService } from '../app-notifications.service';
import { formatIst } from '../../../shared/utils/ist-time.util';

@Component({
  selector: 'app-app-notification-report',
  standalone: true,
  imports: [],
  templateUrl: '../../push-notifications/push-campaign-report/push-campaign-report.component.html',
  styleUrl: '../../push-notifications/push-campaign-report/push-campaign-report.component.scss'
})
export class AppNotificationReportComponent implements OnInit {
  @Input() campaignId!: number;
  loading = true;
  report: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private dataservice: AppNotificationsService,
    private sharedservice: SharedService
  ) {}

  ngOnInit(): void {
    this.dataservice.report(this.campaignId).subscribe({
      next: (res: any) => {
        this.report = res?.data || null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.sharedservice.showAlert(2, 'Could not load report');
      }
    });
  }

  formatIst(value: any): string {
    return formatIst(value);
  }
}
