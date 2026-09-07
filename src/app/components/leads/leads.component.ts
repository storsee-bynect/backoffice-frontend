import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { actionKey, isActionLoading } from '../../shared/utils/action-loading.util';
import { SharedService } from '../../shared/services/shared.service';
import { LeadService } from './leads.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteConfirmationComponent } from '../../shared/components/delete-confirmation/delete-confirmation.component';
import { AddUpdateLeadComponent } from './add-update-lead/add-update-lead.component';
import { UpdateLeadStatusComponent } from './update-lead-status/update-lead-status.component';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss'
})
export class LeadsComponent {
  dataList: any = [];

  searchTxt: string = '';
  page: number = 1;
  totalCount: number = 0;
  limit: number = 10;
  hasEverLoaded = false;
  isTechnicalIssue: boolean = false;
  isListLoading = false;
  isSearchLoading = false;
  btnLoading: string | number | null = null;
  isBtnLoading = (action: string, id?: string | number | null) => isActionLoading(this.btnLoading, action, id);

  stats = { total: 0, new: 0, contacted: 0, proposalSent: 0, won: 0, onHold: 0, lost: 0 };

  get countItems(): { label: string; value: number }[] {
    return [
      { label: 'Total', value: this.stats.total || 0 },
      { label: 'New', value: this.stats.new || 0 },
      { label: 'Contacted', value: this.stats.contacted || 0 },
      { label: 'Proposal Sent', value: this.stats.proposalSent || 0 },
      { label: 'Won', value: this.stats.won || 0 },
      { label: 'On Hold', value: this.stats.onHold || 0 },
      { label: 'Lost', value: this.stats.lost || 0 },
    ];
  }

  constructor(public sharedservice: SharedService, private leadservice: LeadService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.getDataList();
  }

  getDataList(source: 'search' | 'page' | 'limit' | 'refresh' = 'refresh') {
    if (this.isListLoading) return;
    if (source === 'search') this.isSearchLoading = true;
    this.isListLoading = true;

    this.leadservice.getAllLeadsByPage(this.page, this.limit, this.searchTxt).pipe(
      finalize(() => {
        this.isListLoading = false;
        this.isSearchLoading = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res) {
          this.dataList = res.data;
          this.totalCount = res.totalCount;
          if (res?.stats) {
            this.stats = {
              total: Number(res.stats.total || 0),
              new: Number(res.stats.new || 0),
              contacted: Number(res.stats.contacted || 0),
              proposalSent: Number(res.stats.proposalSent || 0),
              won: Number(res.stats.won || 0),
              onHold: Number(res.stats.onHold || 0),
              lost: Number(res.stats.lost || 0),
            };
          }
          this.hasEverLoaded = true;
          this.isTechnicalIssue = false;
        }
      },
      error: () => {
        this.isTechnicalIssue = true;
        this.sharedservice.showAlert(2, 'Technical Issue Found !');
      }
    });
  }

  filterData() {
    if (this.isSearchLoading || this.isListLoading) return;
    this.page = 1;
    this.searchTxt = this.searchTxt.trim();
    this.getDataList('search');
  }

  onPageChange(nextPage: number) {
    if (this.isListLoading) return;
    this.page = nextPage;
    this.getDataList('page');
  }

  onLimitChange() {
    if (this.isListLoading) return;
    this.page = 1;
    this.getDataList('limit');
  }

  deleteData(id: number) {
    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });
    modalRef.result.then(result => {
      if (result) {
        if (id) {
          this.btnLoading = actionKey('delete', id);
          this.leadservice.deleteLead(id).pipe(
            finalize(() => this.btnLoading = null)
          ).subscribe({
            next: () => {
              this.sharedservice.showAlert(1, 'Deleted Successfully');
              this.getDataList();
            },
            error: () => {
              this.sharedservice.showAlert(2, 'Something Went Wrong');
            }
          });
        } else {
          this.sharedservice.showAlert(2, 'Delete Target Not Available');
        }
      }
    });
  }

  addUpdateData(isedit: boolean, data?) {
    const modalRef = this.modalService.open(AddUpdateLeadComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.isEdit = isedit;
    if (data) {
      modalRef.componentInstance.data = data;
    }
    modalRef.result.then(result => {
      if (result) {
        this.getDataList();
      }
    });
  }

  changeStatus(data) {
    if (this.sharedservice.isPageUpdate) {
      const modalRef = this.modalService.open(UpdateLeadStatusComponent, {
        size: 'sm',
        backdrop: 'static',
        centered: true
      });
      modalRef.componentInstance.data = data;
      modalRef.result.then(result => {
        if (result) {
          this.getDataList();
        }
      });
    } else {
      this.sharedservice.showAlert(2, "You Don't have Update Permission");
    }
  }
}
