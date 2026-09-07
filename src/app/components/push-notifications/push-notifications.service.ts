import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  constructor(private http: HttpClient) {}

  getAllByPage(page: number, limit: number, searchTxt: string, status = '') {
    const q = `?limit=${limit}&page=${page}&searchtxt=${encodeURIComponent(searchTxt || '')}&status=${encodeURIComponent(status || '')}`;
    return this.http.get<any>(urlConstant.PushCampaignsAPI.getAllByPage + q);
  }

  getById(id: number) {
    return this.http.get<any>(urlConstant.PushCampaignsAPI.getById + id);
  }

  create(data: any) {
    return this.http.post<any>(urlConstant.PushCampaignsAPI.create, data);
  }

  update(id: number, data: any) {
    return this.http.put<any>(urlConstant.PushCampaignsAPI.update + id, data);
  }

  updateStatus(id: number, status: string) {
    return this.http.put<any>(urlConstant.PushCampaignsAPI.update + id + '/status', { status });
  }

  delete(id: number) {
    return this.http.delete<any>(urlConstant.PushCampaignsAPI.delete + id);
  }

  sendNow(id: number) {
    return this.http.post<any>(urlConstant.PushCampaignsAPI.sendNow + id + '/send-now', {});
  }

  test(id: number) {
    return this.http.post<any>(urlConstant.PushCampaignsAPI.test + id + '/test', {});
  }

  report(id: number) {
    return this.http.get<any>(urlConstant.PushCampaignsAPI.report + id + '/report');
  }

  getSettings() {
    return this.http.get<any>(urlConstant.PushAPI.settings);
  }

  updateSettings(data: any) {
    return this.http.put<any>(urlConstant.PushAPI.settings, data);
  }
}
