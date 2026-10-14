import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { urlConstant } from '../../shared/constant/urlConst';

export interface GoogleCredentials {
  isGoogleLoginEnable: boolean;
  googleClientId: string;
  googleClientSecret: string;
  googleClientSecretConfigured: boolean;
  googleClientSecretHint: string;
}

export interface GoogleCredentialsUpdate {
  isGoogleLoginEnable: boolean;
  googleClientId: string;
  googleClientSecret: string;
}

@Injectable({ providedIn: 'root' })
export class CredentialsService {
  constructor(private http: HttpClient) {}

  getCredentials() {
    return this.http.get<{ status: string; data: { google: GoogleCredentials; otp:any } }>(
      urlConstant.CredentialsAPI.getCredentials
    );
  }
  updateOtp(data:any){return this.http.put<any>(urlConstant.CredentialsAPI.getCredentials.replace('getCredentials','otp'),data);}

  updateGoogle(data: GoogleCredentialsUpdate) {
    return this.http.put<{ status: string; data: { google: GoogleCredentials } }>(
      urlConstant.CredentialsAPI.updateGoogleCredentials,
      data
    );
  }
}
