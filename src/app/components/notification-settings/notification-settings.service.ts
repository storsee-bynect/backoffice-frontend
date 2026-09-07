import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class NotificationSettingsService {
  constructor(private http: HttpClient) {}

  getWebPushSettings() {
    return this.http.get<any>(urlConstant.PushAPI.settings);
  }

  updateWebPushSettings(data: any) {
    return this.http.put<any>(urlConstant.PushAPI.settings, data);
  }

  generateVapidKeys(vapid_subject?: string) {
    return this.http.post<any>(urlConstant.PushAPI.generateVapidKeys, { vapid_subject });
  }

  getAppPushSettings() {
    return this.http.get<any>(urlConstant.AppPushAPI.settings);
  }

  updateAppPushSettings(data: any) {
    return this.http.put<any>(urlConstant.AppPushAPI.settings, data);
  }

  createKey(data: any) {
    return this.http.post<any>(urlConstant.AppPushAPI.createKey, data);
  }

  updateKey(id: number, data: any) {
    return this.http.put<any>(urlConstant.AppPushAPI.updateKey + id, data);
  }

  updateKeyStatus(id: number, enabled: boolean) {
    return this.http.patch<any>(urlConstant.AppPushAPI.updateKeyStatus + id + '/status', { enabled });
  }

  deleteKey(id: number) {
    return this.http.delete<any>(urlConstant.AppPushAPI.deleteKey + id);
  }

  testKey(id: number) {
    return this.http.post<any>(urlConstant.AppPushAPI.testKey + id + '/test', {});
  }
}
