import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';
import {environment} from '../../shared/environment/environment';
@Injectable({
    providedIn: 'root'
})

export class TicketService {
    constructor(private http: HttpClient) { }
    getStoresForTicket(){return this.http.get<any>(environment.APIUrl+'tickets/stores');}

    private listQuery(page, limit, searchTxt, status = '') {
        const st = status ? `&status=${encodeURIComponent(status)}` : '';
        return `?limit=${limit}&page=${page}&searchtxt=${encodeURIComponent(searchTxt || '')}${st}`;
    }

    getTicketList() {
        return this.http.get<any>(urlConstant.TicketsAPI.getTickets);
    }
    getAllTicketsByPage(page, limit, searchTxt, status = '') {
        return this.http.get<any>(urlConstant.TicketsAPI.getAllTicketsByPage + this.listQuery(page, limit, searchTxt, status));
    }
    getTicket(id) {
        return this.http.get<any>(urlConstant.TicketsAPI.getTicket + id);
    }
    addTicket(data) {
        return this.http.post<any>(urlConstant.TicketsAPI.addTicket, data);
    }
    sendMessage(ticketId, message) {
        return this.http.post<any>(urlConstant.TicketsAPI.sendMessage + ticketId + '/messages', { message });
    }
    closeTicket(ticketId) {
        return this.http.put<any>(urlConstant.TicketsAPI.closeTicket + ticketId + '/close', {});
    }
}
