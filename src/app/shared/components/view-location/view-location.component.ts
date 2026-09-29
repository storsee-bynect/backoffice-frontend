import { Component, Input, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import { SharedService } from '../../services/shared.service';

/** Inline SVG so the pin never depends on Leaflet's default marker image assets. */
const RED_PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46" aria-hidden="true">
  <path d="M17 1C8.16 1 1 8.02 1 16.68 1 28.4 17 45 17 45s16-16.6 16-28.32C33 8.02 25.84 1 17 1z"
        fill="#e11d48" stroke="#9f1239" stroke-width="1.5"/>
  <circle cx="17" cy="16.5" r="6" fill="#fff"/>
</svg>`;

@Component({
  selector: 'app-view-location',
  templateUrl: './view-location.component.html',
  styleUrl: './view-location.component.scss'
})
export class ViewLocationComponent implements OnDestroy {
  @Input() data;

  private map?: L.Map;

  constructor(public sharedservice : SharedService, public activeModal : NgbActiveModal){}

  ngOnInit(): void {
    this.map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    const lat = Number(this.data?.latitude);
    const lng = Number(this.data?.longitude);
    const hasCoords =
      this.data?.latitude !== '' && this.data?.latitude != null &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180 &&
      !(lat === 0 && lng === 0);

    if (hasCoords) {
      const pin = L.divIcon({
        html: RED_PIN_SVG,
        className: 'vl-red-pin',
        iconSize: [34, 46],
        iconAnchor: [17, 45],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([lat, lng], { icon: pin, title: 'Location' }).addTo(this.map);
      const ip = String(this.data?.ip || '').trim();
      marker.bindTooltip(ip ? `IP: ${ip}` : `${lat.toFixed(4)}, ${lng.toFixed(4)}`, {
        direction: 'top',
        offset: [0, -42],
      });
      this.map.setView([lat, lng], 11);
    }

    // The modal animates in, so Leaflet measures a 0-size box first; re-measure once visible.
    setTimeout(() => {
      this.map?.invalidateSize();
      if (hasCoords) this.map?.setView([lat, lng], 11);
    }, 250);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

}
