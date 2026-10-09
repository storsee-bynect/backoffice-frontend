import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../shared/environment/environment';

@Injectable({ providedIn: 'root' })
export class IndustriesService {
  constructor(private http: HttpClient) {}
  private get base(): string { return environment.APIUrl + 'industries'; }
  active() { return this.http.get<any>(this.base + '/active'); }
  list(page: number, limit: number, search: string) {
    return this.http.get<any>(this.base, { params: { page, limit, searchtxt: search } });
  }
  create(data: { name: string; isActive: boolean }) { return this.http.post<any>(this.base, data); }
  update(id: number, data: { name: string; isActive: boolean }) { return this.http.put<any>(this.base + '/' + id, data); }
  delete(id: number) { return this.http.delete<any>(this.base + '/' + id); }
}
