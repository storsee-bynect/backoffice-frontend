import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';
@Injectable({
    providedIn: 'root'
})

export class TransactionService {
    constructor(private http: HttpClient) { }

    getTransactionList() {
        return this.http.get<any>(urlConstant.TransactionsAPI.getTransactions);
    }
    getAllTransactionsByPage(page, limit, searchTxt) {
        return this.http.get<any>(urlConstant.TransactionsAPI.getAllTransactionsByPage+`?limit=${limit}&page=${page}&searchtxt=${searchTxt}`);
    }
    getTransactionByStoreId(id) {
        return this.http.post<any>(urlConstant.TransactionsAPI.getTransactionByStoreId,{id});
    }
    getTransactionInvoice(id) {
        return this.http.get<any>(urlConstant.TransactionsAPI.getTransactionInvoice + id);
    }
    addTransaction(data) {
        return this.http.post<any>(urlConstant.TransactionsAPI.addTransaction, data);
    }
    updateTransaction(id, data) {
        return this.http.put<any>(urlConstant.TransactionsAPI.updateTransaction+id, data);
    }
    deleteTransaction(id) {
        return this.http.delete<any>(urlConstant.TransactionsAPI.deleteTransaction+id);
    }
}