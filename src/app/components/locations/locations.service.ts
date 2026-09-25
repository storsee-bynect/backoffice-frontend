import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { urlConstant } from '../../shared/constant/urlConst';

@Injectable({ providedIn: 'root' })
export class LocationsService {
  constructor(private http: HttpClient) {}

  overview(): Observable<any> {
    return this.http.get(urlConstant.LocationsAPI.overview);
  }

  getStates(countryId: number | string, search = ''): Observable<any> {
    let params = new HttpParams().set('countryId', String(countryId));
    if (search) params = params.set('search', search);
    return this.http.get(urlConstant.LocationsAPI.states, { params });
  }

  getCities(stateId: number | string, search = '', page = 1, limit = 500): Observable<any> {
    let params = new HttpParams()
      .set('stateId', String(stateId))
      .set('page', String(page))
      .set('limit', String(limit));
    if (search) params = params.set('search', search);
    return this.http.get(urlConstant.LocationsAPI.cities, { params });
  }

  createCountry(body: any): Observable<any> {
    return this.http.post(urlConstant.LocationsAPI.countries, body);
  }

  updateCountry(id: number, body: any): Observable<any> {
    return this.http.put(urlConstant.LocationsAPI.countries + '/' + id, body);
  }

  deleteCountry(id: number): Observable<any> {
    return this.http.delete(urlConstant.LocationsAPI.countries + '/' + id);
  }

  createState(body: any): Observable<any> {
    return this.http.post(urlConstant.LocationsAPI.adminStates, body);
  }

  updateState(id: number, body: any): Observable<any> {
    return this.http.put(urlConstant.LocationsAPI.adminStates + '/' + id, body);
  }

  deleteState(id: number): Observable<any> {
    return this.http.delete(urlConstant.LocationsAPI.adminStates + '/' + id);
  }

  createCity(body: any): Observable<any> {
    return this.http.post(urlConstant.LocationsAPI.adminCities, body);
  }

  updateCity(id: number, body: any): Observable<any> {
    return this.http.put(urlConstant.LocationsAPI.adminCities + '/' + id, body);
  }

  deleteCity(id: number): Observable<any> {
    return this.http.delete(urlConstant.LocationsAPI.adminCities + '/' + id);
  }

  reseedIndia(): Observable<any> {
    return this.http.post(urlConstant.LocationsAPI.reseedIndia, {});
  }
}
