import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { urlConstant } from '../../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class StoreWalletAdminService {
  constructor(private http: HttpClient) {}

  getWallet(storeId: number): Observable<any> {
    return this.http.get(urlConstant.StoreWalletAPI.get + storeId);
  }

  getLedger(storeId: number, page = 1, limit = 30): Observable<any> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get(urlConstant.StoreWalletAPI.ledger + storeId + '/ledger', { params });
  }

  deposit(storeId: number, body: { amount: number; remark?: string; bucket?: string }): Observable<any> {
    return this.http.post(urlConstant.StoreWalletAPI.deposit + storeId + '/deposit', body);
  }

  withdraw(storeId: number, body: { amount: number; remark?: string; bucket?: string }): Observable<any> {
    return this.http.post(urlConstant.StoreWalletAPI.withdraw + storeId + '/withdraw', body);
  }

  getWithdrawRequests(storeId: number, page = 1, limit = 30, status?: string): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.http.get(urlConstant.StoreWalletAPI.get + storeId + '/withdraw-requests', { params });
  }

  listAllWithdrawRequests(page = 1, limit = 30, status?: string): Observable<any> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status) params = params.set('status', status);
    return this.http.get(urlConstant.StoreWalletAPI.withdrawRequests, { params });
  }

  approveWithdraw(requestId: number, adminRemark?: string): Observable<any> {
    return this.http.post(urlConstant.StoreWalletAPI.approveWithdraw + requestId + '/approve', {
      adminRemark: adminRemark || '',
    });
  }

  rejectWithdraw(requestId: number, adminRemark?: string): Observable<any> {
    return this.http.post(urlConstant.StoreWalletAPI.rejectWithdraw + requestId + '/reject', {
      adminRemark: adminRemark || '',
    });
  }
}
