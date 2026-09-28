import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { SharedService } from '../../shared/services/shared.service';
import { SiteConfigService } from '../site-configuration/site-configuration.service';
import { CredentialsService, GoogleCredentials } from './credentials.service';

type CredentialTab = 'google';

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.component.html',
  styleUrl: './credentials.component.scss'
})
export class CredentialsComponent implements OnInit {
  tabs: { key: CredentialTab; label: string; icon: string }[] = [
    { key: 'google', label: 'Google Login', icon: 'fa-brands fa-google' },
  ];
  activeTab: CredentialTab = 'google';

  isDataLoaded = false;
  isSaving = false;
  showSecret = false;

  google = {
    isGoogleLoginEnable: false,
    googleClientId: '',
    googleClientSecret: '',
  };
  dashboardOrigin = 'https://app.storsee.com';

  constructor(
    public sharedservice: SharedService,
    private credentialsService: CredentialsService,
    private siteConfigService: SiteConfigService
  ) {}

  ngOnInit(): void {
    this.loadCredentials();
    this.siteConfigService.getSiteConfig().subscribe({
      next: (res: any) => {
        const url = String(res?.data?.[0]?.dashboardBaseUrl || '').trim();
        if (url) {
          try { this.dashboardOrigin = new URL(url).origin; } catch { /* keep default */ }
        }
      },
      error: () => {}
    });
  }

  setTab(tab: CredentialTab) {
    this.activeTab = tab;
  }

  loadCredentials() {
    this.credentialsService.getCredentials().subscribe({
      next: (res) => {
        this.applyGoogle(res?.data?.google);
        this.isDataLoaded = true;
      },
      error: () => {
        this.isDataLoaded = true;
        this.sharedservice.showAlert(2, 'Could not load credentials');
      }
    });
  }

  private applyGoogle(g?: GoogleCredentials) {
    this.google = {
      isGoogleLoginEnable: !!g?.isGoogleLoginEnable,
      googleClientId: g?.googleClientId || '',
      googleClientSecret: g?.googleClientSecret || '',
    };
  }

  get googleStatus(): { label: string; tone: 'on' | 'off' | 'warn' } {
    const hasKeys = !!this.google.googleClientId.trim() && !!this.google.googleClientSecret.trim();
    if (this.google.isGoogleLoginEnable && hasKeys) return { label: 'Live', tone: 'on' };
    if (this.google.isGoogleLoginEnable) return { label: 'Keys missing', tone: 'warn' };
    return { label: 'Disabled', tone: 'off' };
  }

  saveGoogle() {
    const clientId = this.google.googleClientId.trim();
    const secret = this.google.googleClientSecret.trim();
    const errors: string[] = [];

    if (clientId && !/^[0-9A-Za-z-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
      errors.push('Client ID must end with .apps.googleusercontent.com');
    }
    if (this.google.isGoogleLoginEnable) {
      if (!clientId) errors.push('Enter Google Client ID');
      if (!secret) errors.push('Enter Google Client Secret');
    }
    if (errors.length) {
      this.sharedservice.showAlert(2, errors.join('<br/>'));
      return;
    }
    if (this.isSaving) return;

    this.isSaving = true;
    this.credentialsService.updateGoogle({
      isGoogleLoginEnable: this.google.isGoogleLoginEnable,
      googleClientId: clientId,
      googleClientSecret: secret,
    }).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (res) => {
        this.applyGoogle(res?.data?.google);
        this.sharedservice.showAlert(1, 'Google Login credentials saved');
      },
      error: (err) => {
        this.sharedservice.showAlert(2, err?.error?.error || 'Something Went Wrong');
      }
    });
  }

  copy(value: string) {
    navigator.clipboard?.writeText(value).then(
      () => this.sharedservice.showAlert(1, 'Copied'),
      () => {}
    );
  }
}
