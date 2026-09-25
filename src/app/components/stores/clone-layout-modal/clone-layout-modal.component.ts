import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../../shared/services/shared.service';
import { StoreService } from '../stores.service';
import { BtnLoadingDirective } from '../../../shared/directives/btn-loading.directive';

type TabKey = 'clone' | 'save' | 'apply';

@Component({
  selector: 'app-clone-layout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, BtnLoadingDirective],
  templateUrl: './clone-layout-modal.component.html',
  styleUrl: './clone-layout-modal.component.scss',
})
export class CloneLayoutModalComponent implements OnInit {
  /** Pre-select source store when opened from a row action */
  @Input() sourceStoreId: number | null = null;
  /** Pre-select target store */
  @Input() targetStoreId: number | null = null;
  @Input() initialTab: TabKey = 'clone';

  tab: TabKey = 'clone';
  stores: any[] = [];
  presets: any[] = [];
  storesLoading = false;
  presetsLoading = false;
  isSaving = false;
  errorMessage = '';

  // Clone
  cloneSourceId: number | null = null;
  cloneTargetId: number | null = null;
  includeCustomCss = true;
  useDraft = false;
  scrubProductRefs = true;

  // Save as preset
  saveStoreId: number | null = null;
  presetCode = '';
  presetLabel = '';
  overwritePreset = false;

  // Apply preset
  applyStoreId: number | null = null;
  applyPresetCode = '';

  constructor(
    public activeModal: NgbActiveModal,
    private storeservice: StoreService,
    public sharedservice: SharedService
  ) {}

  ngOnInit(): void {
    this.tab = this.initialTab || 'clone';
    this.cloneSourceId = this.sourceStoreId;
    this.cloneTargetId = this.targetStoreId;
    this.saveStoreId = this.sourceStoreId;
    this.applyStoreId = this.targetStoreId || this.sourceStoreId;
    this.loadStores();
    this.loadPresets();
  }

  get customPresets(): any[] {
    return (this.presets || []).filter((p) => p.isCustom || p.sourceStoreId);
  }

  storeLabel(s: any): string {
    if (!s) return '';
    return `${s.name} (${s.slug}) #${s.id}`;
  }

  setTab(tab: TabKey): void {
    this.tab = tab;
    this.errorMessage = '';
  }

  loadStores(): void {
    this.storesLoading = true;
    this.storeservice
      .getStoreList()
      .pipe(finalize(() => (this.storesLoading = false)))
      .subscribe({
        next: (res: any) => {
          const list = Array.isArray(res) ? res : res?.data || res?.stores || [];
          this.stores = (list || []).slice().sort((a: any, b: any) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          );
        },
        error: () => {
          this.errorMessage = 'Failed to load stores';
        },
      });
  }

  loadPresets(): void {
    this.presetsLoading = true;
    this.storeservice
      .listLayoutPresets()
      .pipe(finalize(() => (this.presetsLoading = false)))
      .subscribe({
        next: (res: any) => {
          this.presets = res?.data || [];
          if (!this.applyPresetCode && this.customPresets.length) {
            this.applyPresetCode = this.customPresets[0].templateCode;
          }
        },
        error: () => {
          /* non-blocking */
        },
      });
  }

  onPresetCodeInput(): void {
    this.presetCode = String(this.presetCode || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '');
  }

  runClone(): void {
    if (this.isSaving) return;
    if (!this.cloneSourceId || !this.cloneTargetId) {
      this.errorMessage = 'Select source and target store';
      return;
    }
    if (Number(this.cloneSourceId) === Number(this.cloneTargetId)) {
      this.errorMessage = 'Source and target must be different stores';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.storeservice
      .cloneStoreLayout({
        sourceStoreId: Number(this.cloneSourceId),
        targetStoreId: Number(this.cloneTargetId),
        includeCustomCss: this.includeCustomCss,
        useDraft: this.useDraft,
        scrubProductRefs: this.scrubProductRefs,
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res: any) => {
          this.sharedservice.showAlert(1, res?.message || 'Layout cloned');
          this.activeModal.close('cloned');
        },
        error: (err) => {
          this.errorMessage = err?.error?.error || err?.error?.message || 'Clone failed';
        },
      });
  }

  runSavePreset(): void {
    if (this.isSaving) return;
    if (!this.saveStoreId) {
      this.errorMessage = 'Select a source store';
      return;
    }
    if (!this.presetCode || this.presetCode.length < 3) {
      this.errorMessage = 'Enter a preset code (e.g. DEMO_JEWELLERY)';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.storeservice
      .saveLayoutPreset({
        storeId: Number(this.saveStoreId),
        templateCode: this.presetCode,
        label: this.presetLabel || this.presetCode,
        overwrite: this.overwritePreset,
        useDraft: this.useDraft,
        scrubProductRefs: this.scrubProductRefs,
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res: any) => {
          this.sharedservice.showAlert(1, res?.message || 'Preset saved');
          this.loadPresets();
          this.tab = 'apply';
          this.applyPresetCode = this.presetCode;
          this.applyStoreId = this.applyStoreId || this.saveStoreId;
        },
        error: (err) => {
          this.errorMessage = err?.error?.error || err?.error?.message || 'Save failed';
        },
      });
  }

  runApplyPreset(): void {
    if (this.isSaving) return;
    if (!this.applyStoreId) {
      this.errorMessage = 'Select a target store';
      return;
    }
    if (!this.applyPresetCode) {
      this.errorMessage = 'Select a preset';
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    this.storeservice
      .applyLayoutPreset({
        storeId: Number(this.applyStoreId),
        templateCode: this.applyPresetCode,
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res: any) => {
          this.sharedservice.showAlert(1, res?.message || 'Preset applied');
          this.activeModal.close('applied');
        },
        error: (err) => {
          this.errorMessage = err?.error?.error || err?.error?.message || 'Apply failed';
        },
      });
  }
}
