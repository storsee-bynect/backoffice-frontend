import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreService } from '../stores.service';
import { SharedService } from '../../../shared/services/shared.service';

function asBool(val: unknown, defaultTrue = true): boolean {
  if (val === null || val === undefined) return defaultTrue;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0' || s === '') return false;
  }
  return Number(val) === 1;
}

const REASON_INACTIVE = 'Store marked inactive by platform administrator.';
const REASON_LOCKED = 'Store locked by platform administrator.';
const REASON_BLACKLISTED = 'Store blacklisted by platform administrator.';
const REASON_DASHBOARD = 'Dashboard access disabled by platform administrator.';
const AUTO_REASONS = [REASON_INACTIVE, REASON_LOCKED, REASON_BLACKLISTED, REASON_DASHBOARD];

@Component({
  selector: 'app-store-settings',
  templateUrl: './store-settings.component.html',
  styleUrls: ['./store-settings.component.scss']
})
export class StoreSettingsComponent implements OnInit {
  @Input() store: any;

  readonly maxLimit = 10000000;
  readonly maxReason = 500;
  readonly maxNotes = 5000;

  isSaving = false;
  fullAccess = true;

  isActive = true;
  isLocked = false;
  isBlacklisted = false;
  allowStorefront = true;
  allowDashboard = true;
  allowCheckout = true;
  allowProductAdd = true;
  allowThemeEdit = true;

  useCustomProductLimit = false;
  useCustomOrderLimit = false;
  productLimit: number | null = 150;
  maxOrders: number | null = 100;

  lockReason = '';
  adminNotes = '';

  constructor(
    public activeModal: NgbActiveModal,
    private storeservice: StoreService,
    public sharedservice: SharedService,
  ) {}

  ngOnInit(): void {
    if (!this.store) return;
    this.isActive = asBool(this.store.isActive, true);
    this.isLocked = asBool(this.store.isLocked, false);
    this.isBlacklisted = asBool(this.store.isBlacklisted, false);
    this.allowStorefront = asBool(this.store.allowStorefront, true);
    this.allowDashboard = asBool(this.store.allowDashboard, true);
    this.allowCheckout = asBool(this.store.allowCheckout, true);
    this.allowProductAdd = asBool(this.store.allowProductAdd, true);
    this.allowThemeEdit = asBool(this.store.allowThemeEdit, true);
    this.lockReason = String(this.store.lockReason || '').trim().slice(0, this.maxReason);
    this.adminNotes = String(this.store.adminNotes || '').trim().slice(0, this.maxNotes);

    const pl = Number(this.store.productLimit || 0);
    const mo = Number(this.store.maxOrders || 0);
    this.useCustomProductLimit = pl > 0;
    this.useCustomOrderLimit = mo > 0;
    this.productLimit = pl > 0 ? pl : 150;
    this.maxOrders = mo > 0 ? mo : 100;

    this.syncFullAccessFlag();
  }

  get needsReason(): boolean {
    return this.isBlacklisted || this.isLocked || !this.isActive || !this.allowDashboard;
  }

  limitLabel(value: number): string {
    return !value || value <= 0 ? 'Unlimited' : String(value);
  }

  isValidLimit(value: unknown): boolean {
    const n = Number(value);
    return value !== null && value !== '' && Number.isInteger(n) && n >= 1 && n <= this.maxLimit;
  }

  syncFullAccessFlag() {
    this.fullAccess =
      !this.isLocked &&
      !this.isBlacklisted &&
      !!this.isActive &&
      this.allowStorefront &&
      this.allowDashboard &&
      this.allowCheckout &&
      this.allowProductAdd &&
      this.allowThemeEdit;
  }

  onFullAccessChange(enabled: boolean) {
    if (enabled) {
      this.restoreFullAccess();
    }
    this.syncFullAccessFlag();
  }

  onActiveChange(enabled: boolean) {
    if (!enabled) {
      if (!this.lockReason.trim()) {
        this.lockReason = REASON_INACTIVE;
      }
    } else if (this.lockReason === REASON_INACTIVE && !this.isLocked && !this.isBlacklisted) {
      this.lockReason = '';
    }
    this.syncFullAccessFlag();
  }

  onLockChange(enabled: boolean) {
    if (enabled) {
      this.allowDashboard = false;
      this.allowStorefront = false;
      if (!this.lockReason.trim()) {
        this.lockReason = REASON_LOCKED;
      }
    } else if (!this.isBlacklisted) {
      this.allowStorefront = true;
      this.allowDashboard = true;
      if (this.lockReason === REASON_LOCKED) {
        this.lockReason = '';
      }
    }
    this.syncFullAccessFlag();
  }

  onBlacklistChange(enabled: boolean) {
    if (enabled) {
      this.isLocked = true;
      this.isActive = false;
      this.allowStorefront = false;
      this.allowDashboard = false;
      this.allowCheckout = false;
      this.allowProductAdd = false;
      this.allowThemeEdit = false;
      if (!this.lockReason.trim() || this.lockReason === REASON_LOCKED) {
        this.lockReason = REASON_BLACKLISTED;
      }
    } else {
      this.isLocked = false;
      this.isActive = true;
      this.allowStorefront = true;
      this.allowDashboard = true;
      this.allowCheckout = true;
      this.allowProductAdd = true;
      this.allowThemeEdit = true;
      if (AUTO_REASONS.includes(this.lockReason)) {
        this.lockReason = '';
      }
    }
    this.syncFullAccessFlag();
  }

  onFeatureChange() {
    if (!this.allowDashboard && !this.lockReason.trim()) {
      this.lockReason = REASON_DASHBOARD;
    } else if (this.allowDashboard && this.lockReason === REASON_DASHBOARD && !this.needsReason) {
      this.lockReason = '';
    }
    this.syncFullAccessFlag();
  }

  restoreFullAccess() {
    this.isLocked = false;
    this.isBlacklisted = false;
    this.isActive = true;
    this.allowStorefront = true;
    this.allowDashboard = true;
    this.allowCheckout = true;
    this.allowProductAdd = true;
    this.allowThemeEdit = true;
    this.lockReason = '';
    this.fullAccess = true;
  }

  saveSettings() {
    if (!this.store?.id) return;
    if (this.isSaving) return;

    if (this.useCustomProductLimit && !this.isValidLimit(this.productLimit)) {
      this.sharedservice.showAlert(2, `Product limit must be a whole number between 1 and ${this.maxLimit}, or choose Unlimited`);
      return;
    }
    if (this.useCustomOrderLimit && !this.isValidLimit(this.maxOrders)) {
      this.sharedservice.showAlert(2, `Order limit must be a whole number between 1 and ${this.maxLimit}, or choose Unlimited`);
      return;
    }
    const reason = this.lockReason.trim();
    const notes = this.adminNotes.trim();
    if (this.needsReason && !reason) {
      this.sharedservice.showAlert(2, 'Please enter a reason — it is shown to the store owner after login.');
      return;
    }
    if (reason.length > this.maxReason) {
      this.sharedservice.showAlert(2, `Reason must be ${this.maxReason} characters or fewer`);
      return;
    }
    if (notes.length > this.maxNotes) {
      this.sharedservice.showAlert(2, `Admin notes must be ${this.maxNotes} characters or fewer`);
      return;
    }

    this.isSaving = true;
    const body = {
      isActive: this.isActive,
      isLocked: this.isLocked,
      isBlacklisted: this.isBlacklisted,
      allowStorefront: this.allowStorefront,
      allowDashboard: this.allowDashboard,
      allowCheckout: this.allowCheckout,
      allowProductAdd: this.allowProductAdd,
      allowThemeEdit: this.allowThemeEdit,
      productLimit: this.useCustomProductLimit ? Number(this.productLimit) : 0,
      maxOrders: this.useCustomOrderLimit ? Number(this.maxOrders) : 0,
      lockReason: reason,
      adminNotes: notes,
    };

    this.storeservice.updateStoreSettings(this.store.id, body).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (res) => {
        this.sharedservice.showAlert(1, 'Store settings saved');
        this.activeModal.close(res?.store || true);
      },
      error: (err) => {
        this.sharedservice.showAlert(2, err.error?.message || err.error?.error || 'Something went wrong');
      }
    });
  }
}
