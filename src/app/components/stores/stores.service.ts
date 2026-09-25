import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';
@Injectable({
    providedIn: 'root'
})

export class StoreService {
    constructor(private http: HttpClient) { }

    getStoreList() {
        return this.http.get<any>(urlConstant.StoresAPI.getStores);
    }
    getAllStoresByPage(page, limit, searchTxt) {
        return this.http.get<any>(urlConstant.StoresAPI.getAllStoresByPage+`?limit=${limit}&page=${page}&searchtxt=${searchTxt}`);
    }
    getStoreById(id) {
        return this.http.post<any>(urlConstant.StoresAPI.getStoreById,{id});
    }
    addStore(data) {
        return this.http.post<any>(urlConstant.StoresAPI.addStore, data);
    }
    updateStore(id, data) {
        return this.http.put<any>(urlConstant.StoresAPI.updateStore+id, data);
    }
    deleteStore(id) {
        return this.http.delete<any>(urlConstant.StoresAPI.deleteStore+id);
    }
    renewStorePlan(storeId, body: { packageId: number; applyPackageLimits?: boolean; productLimit?: number; maxOrders?: number }) {
        return this.http.post<any>(urlConstant.StoresAPI.renewStorePlan + storeId, body);
    }
    updateStoreLimits(storeId, data: { productLimit: number; maxOrders: number }) {
        return this.http.put<any>(urlConstant.StoresAPI.updateStoreLimits + storeId, data);
    }
    updateStoreSettings(storeId, data: any) {
        return this.http.put<any>(urlConstant.StoresAPI.updateStoreSettings + storeId, data);
    }

    cloneStoreLayout(body: {
        sourceStoreId: number;
        targetStoreId: number;
        includeCustomCss?: boolean;
        useDraft?: boolean;
        scrubProductRefs?: boolean;
    }) {
        return this.http.post<any>(urlConstant.ThemeLayoutAPI.cloneLayout, body);
    }

    saveLayoutPreset(body: {
        storeId: number;
        templateCode: string;
        label?: string;
        overwrite?: boolean;
        useDraft?: boolean;
        scrubProductRefs?: boolean;
    }) {
        return this.http.post<any>(urlConstant.ThemeLayoutAPI.saveLayoutPreset, body);
    }

    listLayoutPresets() {
        return this.http.get<any>(urlConstant.ThemeLayoutAPI.listLayoutPresets);
    }

    applyLayoutPreset(body: { storeId: number; templateCode: string }) {
        return this.http.post<any>(urlConstant.ThemeLayoutAPI.applyLayoutPreset, body);
    }
}