import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private get base() {
    return urlConstant.ShippingAPI.adminBase;
  }

  constructor(private http: HttpClient) {}

  overview() {
    return this.http.get<any>(this.base + 'overview');
  }

  providers() {
    return this.http.get<any>(this.base + 'providers');
  }

  updateProvider(id: number, body: any) {
    return this.http.patch<any>(this.base + 'providers/' + id, body);
  }

  reorderProviders(orderedProviderIds: number[]) {
    return this.http.post<any>(this.base + 'providers/reorder', { orderedProviderIds });
  }

  saveCredentials(id: number, secrets: any) {
    return this.http.post<any>(this.base + 'providers/' + id + '/credentials', { secrets });
  }

  testProvider(id: number) {
    return this.http.post<any>(this.base + 'providers/' + id + '/test', {});
  }

  calculateRates(body: any) {
    return this.http.post<any>(this.base + 'rates/calculate', body);
  }

  rules() {
    return this.http.get<any>(this.base + 'rules');
  }

  saveRule(body: any) {
    return this.http.post<any>(this.base + 'rules', body);
  }

  deleteRule(id: number) {
    return this.http.delete<any>(this.base + 'rules/' + id);
  }

  marginRules() {
    return this.http.get<any>(this.base + 'margin-rules');
  }

  saveMarginRule(body: any) {
    return this.http.post<any>(this.base + 'margin-rules', body);
  }

  deleteMarginRule(id: number) {
    return this.http.delete<any>(this.base + 'margin-rules/' + id);
  }

  shipments(params?: any) {
    return this.http.get<any>(this.base + 'shipments', { params });
  }

  analytics() {
    return this.http.get<any>(this.base + 'analytics');
  }

  logs() {
    return this.http.get<any>(this.base + 'logs');
  }

  webhooks() {
    return this.http.get<any>(this.base + 'webhooks');
  }

  remittances() {
    return this.http.get<any>(this.base + 'remittances');
  }

  merchantConfigs() {
    return this.http.get<any>(this.base + 'merchant-configs');
  }

  platformSettings() {
    return this.http.get<any>(this.base + 'platform-settings');
  }

  updatePlatformSettings(body: { storseeEnabled: boolean }) {
    return this.http.patch<any>(this.base + 'platform-settings', body);
  }
}
