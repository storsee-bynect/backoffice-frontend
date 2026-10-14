import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';
@Injectable({
    providedIn: 'root'
})

export class StoreuserService {
    constructor(private http: HttpClient) { }

    getStoreuserList() {
        return this.http.get<any>(urlConstant.StoreusersAPI.getStoreusers);
    }
    otpHistory(id:number){return this.http.get<any>(urlConstant.StoreusersAPI.getAllStoreadminsByPage.replace('getAllStoreadminsByPage',id+'/otp-history'));}
    getAllStoreadminsByPage(page, limit, searchTxt) {
        return this.http.get<any>(urlConstant.StoreusersAPI.getAllStoreadminsByPage+`?limit=${limit}&page=${page}&searchtxt=${searchTxt}`);
    }
    getStoreusersByStoreId(id) {
        return this.http.get<any>(urlConstant.StoreusersAPI.getStoreusersByStoreId+id);
    }
    addStoreuser(data) {
        return this.http.post<any>(urlConstant.StoreusersAPI.addStoreuser, data);
    }
    updateStoreuser(id, data) {
        return this.http.put<any>(urlConstant.StoreusersAPI.updateStoreuser+id, data);
    }
    deleteStoreuser(id) {
        return this.http.delete<any>(urlConstant.StoreusersAPI.deleteStoreuser+id);
    }
}
