import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class AppNotificationsService {
  constructor(private http: HttpClient) {}

  getAllByPage(page: number, limit: number, searchTxt: string, status = '') {
    const q = `?limit=${limit}&page=${page}&searchtxt=${encodeURIComponent(searchTxt || '')}&status=${encodeURIComponent(status || '')}`;
    return this.http.get<any>(urlConstant.AppPushCampaignsAPI.getAllByPage + q);
  }

  getById(id: number) {
    return this.http.get<any>(urlConstant.AppPushCampaignsAPI.getById + id);
  }

  create(data: any) {
    return this.http.post<any>(urlConstant.AppPushCampaignsAPI.create, data);
  }

  update(id: number, data: any) {
    return this.http.put<any>(urlConstant.AppPushCampaignsAPI.update + id, data);
  }

  updateStatus(id: number, status: string) {
    return this.http.put<any>(urlConstant.AppPushCampaignsAPI.update + id + '/status', { status });
  }

  delete(id: number) {
    return this.http.delete<any>(urlConstant.AppPushCampaignsAPI.delete + id);
  }

  sendNow(id: number) {
    return this.http.post<any>(urlConstant.AppPushCampaignsAPI.sendNow + id + '/send-now', {});
  }

  test(id: number) {
    return this.http.post<any>(urlConstant.AppPushCampaignsAPI.test + id + '/test', {});
  }

  report(id: number) {
    return this.http.get<any>(urlConstant.AppPushCampaignsAPI.report + id + '/report');
  }
}
