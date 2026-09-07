import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { urlConstant } from '../constant/urlConst';
import { SharedService } from './shared.service';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

@Injectable({ providedIn: 'root' })
export class PushService {
  private workerReady: Promise<ServiceWorkerRegistration | null> | null = null;

  constructor(
    private http: HttpClient,
    private sharedservice: SharedService
  ) {}

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async registerWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    if (!this.workerReady) {
      this.workerReady = navigator.serviceWorker.register('/push-sw.js', { scope: '/' }).catch(() => null);
    }
    return this.workerReady;
  }

  async syncIfGranted(): Promise<void> {
    if (!this.isSupported()) return;
    if (!this.sharedservice.userData && !(this.sharedservice as any).customerData) return;
    await this.registerWorker();
    if (Notification.permission !== 'granted') return;
    try {
      await this.subscribeAndSave();
    } catch {
      /* ignore */
    }
  }

  async enable(): Promise<boolean> {
    if (!this.isSupported()) {
      this.sharedservice.showAlert(2, 'Push notifications are not supported in this browser.');
      return false;
    }
    await this.registerWorker();
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      this.sharedservice.showAlert(2, 'Notifications are blocked. Enable them in browser settings.');
      return false;
    }
    await this.subscribeAndSave();
    await firstValueFrom(this.http.put(urlConstant.PushAPI.preference, { enabled: true }));
    this.sharedservice.showAlert(1, 'Notifications enabled');
    return true;
  }

  async disable(): Promise<void> {
    if (!this.isSupported()) {
      await firstValueFrom(this.http.put(urlConstant.PushAPI.preference, { enabled: false }));
      return;
    }
    await this.registerWorker();
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      try {
        await firstValueFrom(this.http.request('DELETE', urlConstant.PushAPI.unsubscribe, { body: { endpoint: sub.endpoint } }));
      } catch {}
      try {
        await sub.unsubscribe();
      } catch {}
    } else {
      try {
        await firstValueFrom(this.http.request('DELETE', urlConstant.PushAPI.unsubscribe, { body: {} }));
      } catch {}
    }
    await firstValueFrom(this.http.put(urlConstant.PushAPI.preference, { enabled: false }));
  }

  private async subscribeAndSave(): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    const keyRes: any = await firstValueFrom(this.http.get(urlConstant.PushAPI.vapidPublicKey));
    const publicKey = keyRes?.data?.publicKey;
    if (!publicKey) throw new Error('VAPID public key missing');

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }
    const json = sub.toJSON();
    await firstValueFrom(
      this.http.post(urlConstant.PushAPI.subscribe, {
        endpoint: json.endpoint,
        keys: json.keys,
      })
    );
  }
}
