import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment/environment';
import { rebuildUrlConstant } from '../constant/urlConst';

export interface AppConfiguration {
  /** @deprecated Prefer APIUrlLocal / APIUrlLive — kept as fallback */
  APIUrl?: string;
  APIUrlLocal?: string;
  APIUrlLive?: string;
  [key: string]: any;
}

const DEFAULT_LOCAL_API = 'http://localhost:9999/api/';
const DEFAULT_LIVE_API = 'https://api.storsee.com/api/';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfiguration = {};

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const cfg = await firstValueFrom(
        this.http.get<AppConfiguration>('assets/configuration.json')
      );
      this.config = cfg || {};
      environment.APIUrl = this.resolveApiUrl(this.config);
      rebuildUrlConstant();
    } catch {
      environment.APIUrl = this.resolveApiUrl({});
      rebuildUrlConstant();
    }
  }

  get<T = any>(key: keyof AppConfiguration | string, fallback?: T): T {
    const val = (this.config as any)?.[key as any];
    return (val !== undefined ? val : (fallback as any)) as T;
  }

  /** Local host → local API; VPS / public domain → live API */
  private resolveApiUrl(cfg: AppConfiguration): string {
    const local = this.ensureTrailingSlash(
      String(cfg.APIUrlLocal || cfg.APIUrl || DEFAULT_LOCAL_API).trim() || DEFAULT_LOCAL_API
    );
    const live = this.ensureTrailingSlash(
      String(cfg.APIUrlLive || cfg.APIUrl || DEFAULT_LIVE_API).trim() || DEFAULT_LIVE_API
    );
    return this.isLocalRuntime() ? local : live;
  }

  private isLocalRuntime(): boolean {
    if (typeof window === 'undefined' || !window.location) return true;
    const host = String(window.location.hostname || '').toLowerCase();
    if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
      return true;
    }
    // Private LAN (local ng serve on network IP)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return true;
    return false;
  }

  private ensureTrailingSlash(url: string): string {
    if (!url) return url;
    return url.endsWith('/') ? url : url + '/';
  }
}
