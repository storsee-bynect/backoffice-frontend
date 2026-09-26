import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class BlogsService {
  constructor(private http: HttpClient) {}

  getAllByPage(page: number, limit: number, searchTxt: string) {
    return this.http.get<any>(
      `${urlConstant.BlogsAPI.getAllByPage}?limit=${limit}&page=${page}&searchtxt=${encodeURIComponent(searchTxt || '')}`
    );
  }

  getById(id: number) {
    return this.http.get<any>(urlConstant.BlogsAPI.getById + id);
  }

  add(data: any) {
    return this.http.post<any>(urlConstant.BlogsAPI.create, data);
  }

  update(id: number, data: any) {
    return this.http.put<any>(urlConstant.BlogsAPI.update + id, data);
  }

  delete(id: number) {
    return this.http.delete<any>(urlConstant.BlogsAPI.delete + id);
  }
}
