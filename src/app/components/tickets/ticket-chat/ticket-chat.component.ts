import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { TicketService } from '../tickets.service';
import { DeleteConfirmationComponent } from '../../../shared/components/delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-ticket-chat',
  templateUrl: './ticket-chat.component.html',
  styleUrl: './ticket-chat.component.scss'
})
export class TicketChatComponent {
  @ViewChild('messagesPane') messagesPane?: ElementRef<HTMLElement>;

  ticketId: number;
  ticket: any = null;
  messages: any[] = [];
  draft = '';
  isLoading = true;
  isSending = false;
  isRefreshing = false;
  isClosing = false;
  isTechnicalIssue = false;
  isAdmin = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public sharedservice: SharedService,
    private ticketservice: TicketService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.ticketId) {
      this.router.navigate(['/tickets']);
      return;
    }
    this.loadTicket();
  }

  loadTicket(showRefresh = false) {
    if (showRefresh) this.isRefreshing = true;
    else this.isLoading = true;

    this.ticketservice.getTicket(this.ticketId).pipe(
      finalize(() => {
        this.isLoading = false;
        this.isRefreshing = false;
      })
    ).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.ticket = res.data;
          this.messages = res.data.messages || [];
          this.isTechnicalIssue = false;
          this.scrollToBottom();
        }
      },
      error: () => {
        this.isTechnicalIssue = true;
        this.sharedservice.showAlert(2, 'Unable to load ticket');
      }
    });
  }

  refresh() {
    if (this.isRefreshing || this.isLoading) return;
    this.loadTicket(true);
  }

  sendMessage() {
    const text = this.draft.trim();
    if (!text || this.isSending || !this.isOpen()) return;

    this.isSending = true;
    this.ticketservice.sendMessage(this.ticketId, text).pipe(
      finalize(() => this.isSending = false)
    ).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.messages = [...this.messages, res.data];
          this.draft = '';
          this.scrollToBottom();
        } else {
          this.loadTicket(true);
        }
      },
      error: (err) => {
        const msg = err?.error?.error || 'Unable to send message';
        this.sharedservice.showAlert(2, msg);
      }
    });
  }

  closeTicket() {
    if (!this.isOpen() || this.isClosing) return;

    const modalRef = this.modalService.open(DeleteConfirmationComponent, {
      size: 'md',
      centered: true
    });

    modalRef.result.then(result => {
      if (!result) return;
      this.isClosing = true;
      this.ticketservice.closeTicket(this.ticketId).pipe(
        finalize(() => this.isClosing = false)
      ).subscribe({
        next: () => {
          this.sharedservice.showAlert(1, 'Ticket closed');
          this.loadTicket(true);
        },
        error: (err) => {
          const msg = err?.error?.error || 'Unable to close ticket';
          this.sharedservice.showAlert(2, msg);
        }
      });
    }).catch(() => {});
  }

  isOpen(): boolean {
    const s = String(this.ticket?.status ?? '').toLowerCase();
    return s === 'open' || s === '1';
  }

  /** Admin-side: my messages right, store left */
  isMine(msg: any): boolean {
    return msg?.senderType === 'admin';
  }

  formatTime(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesPane?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  goBack() {
    this.router.navigate(['/tickets']);
  }
}
