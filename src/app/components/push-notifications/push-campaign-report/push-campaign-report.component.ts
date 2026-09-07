import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { PushNotificationsService } from '../push-notifications.service';
import { formatIst } from '../../../shared/utils/ist-time.util';

@Component({
  selector: 'app-push-campaign-report',
  standalone: true,
  imports: [],
  templateUrl: './push-campaign-report.component.html',
  styleUrl: './push-campaign-report.component.scss'
})
export class PushCampaignReportComponent implements OnInit {
  @Input() campaignId!: number;
  loading = true;
  report: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private dataservice: PushNotificationsService,
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
