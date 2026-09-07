import {
  Component, Input, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewInit, NgZone
} from '@angular/core';
import { FileUploadService } from './file-upload.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from '../../services/shared.service';

type Stage = 'select' | 'crop' | 'done';

interface CropBox { x: number; y: number; w: number; h: number; }
type Handle = 'tl'|'tr'|'bl'|'br'|'t'|'b'|'l'|'r'|'move'|null;

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() directory: string;
  @Input() dimentions: { width: number; height: number } | null = null;

  @ViewChild('cropCanvas') cropCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dropZone') dropZoneRef!: ElementRef<HTMLDivElement>;

  stage: Stage = 'select';
  directoryName = '';
  fileUrl = '';
  fileId: number;

  private rawImage: HTMLImageElement | null = null;
  private rawFile: File | null = null;

  private ctx: CanvasRenderingContext2D | null = null;
  private canvasW = 0;
  private canvasH = 0;
  private imgRect = { x: 0, y: 0, w: 0, h: 0 };

  crop: CropBox = { x: 0, y: 0, w: 0, h: 0 };
  private dragging: Handle = null;
  private dragStart = { mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 };

  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;

  private boundMouseMove!: (e: MouseEvent) => void;
  private boundMouseUp!: (e: MouseEvent) => void;
  private boundTouchMove!: (e: TouchEvent) => void;
  private boundTouchEnd!: (e: TouchEvent) => void;

  constructor(
    public activeModal: NgbActiveModal,
    public sharedservice: SharedService,
    private fileUploadService: FileUploadService,
    private zone: NgZone
  ) {}

  ngOnInit(): void { this.directoryName = this.directory || ''; }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.removeListeners(); }

  // ─── File selection ────────────────────────────────────────────────────────

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.loadFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.loadFile(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(): void { this.isDragOver = false; }

  private loadFile(file: File): void {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      this.sharedservice.showAlert(2, 'Upload PNG / JPG / WEBP / GIF only');
      return;
    }
    this.rawFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.rawImage = img;
        this.stage = 'crop';
        setTimeout(() => this.initCanvas(), 50);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ─── Canvas / Crop ─────────────────────────────────────────────────────────

  private initCanvas(): void {
    const canvas = this.cropCanvasRef?.nativeElement;
    if (!canvas || !this.rawImage) return;

    const container = canvas.parentElement!;
    const maxW = container.clientWidth || 560;
    const maxH = Math.min(window.innerHeight * 0.45, 400);

    const imgW = this.rawImage.naturalWidth;
    const imgH = this.rawImage.naturalHeight;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);

    this.canvasW = Math.round(imgW * scale);
    this.canvasH = Math.round(imgH * scale);
    canvas.width = this.canvasW;
    canvas.height = this.canvasH;
    canvas.style.width = this.canvasW + 'px';
    canvas.style.height = this.canvasH + 'px';

    this.imgRect = { x: 0, y: 0, w: this.canvasW, h: this.canvasH };
    this.ctx = canvas.getContext('2d')!;

    // default crop = full image selected (user can still resize/move)
    this.crop = { x: 0, y: 0, w: this.canvasW, h: this.canvasH };

    this.drawCanvas();
    this.attachListeners(canvas);
  }

  private drawCanvas(): void {
    if (!this.ctx || !this.rawImage) return;
    const { x: ix, y: iy, w: iw, h: ih } = this.imgRect;
    const { x, y, w, h } = this.crop;

    this.ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    this.ctx.drawImage(this.rawImage, ix, iy, iw, ih);

    this.ctx.fillStyle = 'rgba(0,0,0,0.52)';
    this.ctx.fillRect(0, 0, this.canvasW, iy);
    this.ctx.fillRect(0, iy + ih, this.canvasW, this.canvasH);
    this.ctx.fillRect(0, y, x, h);
    this.ctx.fillRect(x + w, y, this.canvasW - x - w, h);

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    this.ctx.lineWidth = 0.8;
    for (let i = 1; i < 3; i++) {
      this.ctx.beginPath(); this.ctx.moveTo(x + (w / 3) * i, y); this.ctx.lineTo(x + (w / 3) * i, y + h); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(x, y + (h / 3) * i); this.ctx.lineTo(x + w, y + (h / 3) * i); this.ctx.stroke();
    }

    const hs = 9;
    this.ctx.fillStyle = '#ffffff';
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
      this.ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
    });
    [[x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]].forEach(([cx, cy]) => {
      this.ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
    });
  }

  // ─── Mouse / Touch ─────────────────────────────────────────────────────────

  private attachListeners(canvas: HTMLCanvasElement): void {
    this.removeListeners();
    this.boundMouseMove = (e) => this.zone.run(() => this.onMouseMove(e));
    this.boundMouseUp   = (e) => this.zone.run(() => this.onMouseUp(e));
    this.boundTouchMove = (e) => this.zone.run(() => this.onTouchMove(e));
    this.boundTouchEnd  = (e) => this.zone.run(() => this.onTouchEnd(e));

    canvas.addEventListener('mousedown', (e) => this.zone.run(() => this.onMouseDown(e)));
    canvas.addEventListener('touchstart', (e) => this.zone.run(() => this.onTouchStart(e)), { passive: false });
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('touchmove', this.boundTouchMove, { passive: false } as any);
    document.addEventListener('touchend', this.boundTouchEnd);
  }

  private removeListeners(): void {
    if (this.boundMouseMove) document.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp)   document.removeEventListener('mouseup', this.boundMouseUp);
    if (this.boundTouchMove) document.removeEventListener('touchmove', this.boundTouchMove);
    if (this.boundTouchEnd)  document.removeEventListener('touchend', this.boundTouchEnd);
  }

  private getCanvasPos(clientX: number, clientY: number): { mx: number; my: number } {
    const canvas = this.cropCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return { mx: (clientX - rect.left) * (canvas.width / rect.width), my: (clientY - rect.top) * (canvas.height / rect.height) };
  }

  private hitHandle(mx: number, my: number): Handle {
    const { x, y, w, h } = this.crop;
    const ht = 12;
    if (mx < x - ht || mx > x + w + ht || my < y - ht || my > y + h + ht) return null;
    const nearL = Math.abs(mx - x) < ht, nearR = Math.abs(mx - (x + w)) < ht;
    const nearT = Math.abs(my - y) < ht, nearB = Math.abs(my - (y + h)) < ht;
    if (nearT && nearL) return 'tl'; if (nearT && nearR) return 'tr';
    if (nearB && nearL) return 'bl'; if (nearB && nearR) return 'br';
    if (nearT) return 't'; if (nearB) return 'b'; if (nearL) return 'l'; if (nearR) return 'r';
    if (mx > x && mx < x + w && my > y && my < y + h) return 'move';
    return null;
  }

  private startDrag(mx: number, my: number): void {
    const handle = this.hitHandle(mx, my);
    if (!handle) return;
    this.dragging = handle;
    this.dragStart = { mx, my, cx: this.crop.x, cy: this.crop.y, cw: this.crop.w, ch: this.crop.h };
  }

  private doDrag(mx: number, my: number): void {
    if (!this.dragging) return;
    const dx = mx - this.dragStart.mx, dy = my - this.dragStart.my;
    const { cx, cy, cw, ch } = this.dragStart;
    const { x: ix, y: iy, w: iw, h: ih } = this.imgRect;
    const min = 20;
    let { x, y, w, h } = this.crop;
    switch (this.dragging) {
      case 'move': x = Math.max(ix, Math.min(ix + iw - cw, cx + dx)); y = Math.max(iy, Math.min(iy + ih - ch, cy + dy)); w = cw; h = ch; break;
      case 'tl': x = Math.min(cx + cw - min, cx + dx); y = Math.min(cy + ch - min, cy + dy); w = cx + cw - x; h = cy + ch - y; break;
      case 'tr': y = Math.min(cy + ch - min, cy + dy); w = Math.max(min, cw + dx); h = cy + ch - y; break;
      case 'bl': x = Math.min(cx + cw - min, cx + dx); w = cx + cw - x; h = Math.max(min, ch + dy); break;
      case 'br': w = Math.max(min, cw + dx); h = Math.max(min, ch + dy); break;
      case 't': y = Math.min(cy + ch - min, cy + dy); h = cy + ch - y; break;
      case 'b': h = Math.max(min, ch + dy); break;
      case 'l': x = Math.min(cx + cw - min, cx + dx); w = cx + cw - x; break;
      case 'r': w = Math.max(min, cw + dx); break;
    }
    x = Math.max(ix, x); y = Math.max(iy, y);
    if (x + w > ix + iw) w = ix + iw - x;
    if (y + h > iy + ih) h = iy + ih - y;
    this.crop = { x, y, w, h };
    this.drawCanvas();
  }

  onMouseDown(e: MouseEvent): void { const { mx, my } = this.getCanvasPos(e.clientX, e.clientY); this.startDrag(mx, my); }
  onMouseMove(e: MouseEvent): void { if (!this.dragging) return; const { mx, my } = this.getCanvasPos(e.clientX, e.clientY); this.doDrag(mx, my); }
  onMouseUp(_e: MouseEvent): void { this.dragging = null; }
  onTouchStart(e: TouchEvent): void { e.preventDefault(); const t = e.touches[0]; const { mx, my } = this.getCanvasPos(t.clientX, t.clientY); this.startDrag(mx, my); }
  onTouchMove(e: TouchEvent): void { e.preventDefault(); if (!this.dragging) return; const t = e.touches[0]; const { mx, my } = this.getCanvasPos(t.clientX, t.clientY); this.doDrag(mx, my); }
  onTouchEnd(_e: TouchEvent): void { this.dragging = null; }

  // ─── Crop & Upload ─────────────────────────────────────────────────────────

  applyCrop(): void {
    if (!this.rawImage) return;
    const scaleX = this.rawImage.naturalWidth / this.imgRect.w;
    const scaleY = this.rawImage.naturalHeight / this.imgRect.h;
    const srcX = Math.round((this.crop.x - this.imgRect.x) * scaleX);
    const srcY = Math.round((this.crop.y - this.imgRect.y) * scaleY);
    const srcW = Math.round(this.crop.w * scaleX);
    const srcH = Math.round(this.crop.h * scaleY);

    const offscreen = document.createElement('canvas');
    offscreen.width = srcW; offscreen.height = srcH;
    offscreen.getContext('2d')!.drawImage(this.rawImage, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

    offscreen.toBlob((blob) => {
      this.zone.run(() => {
        if (!blob) { this.sharedservice.showAlert(2, 'Crop failed'); return; }
        const ext = this.rawFile?.name.split('.').pop() || 'jpg';
        this.uploadCropped(new File([blob], `cropped.${ext}`, { type: blob.type }));
      });
    }, this.rawFile?.type || 'image/jpeg', 0.92);
  }

  private uploadCropped(file: File): void {
    if (!this.directoryName) return;
    this.isUploading = true;
    this.uploadProgress = 0;

    const interval = setInterval(() => {
      this.zone.run(() => { if (this.uploadProgress < 85) this.uploadProgress += 5; });
    }, 150);

    this.fileUploadService.uploadFile(file, this.directoryName).subscribe({
      next: (response) => {
        this.zone.run(() => {
          clearInterval(interval);
          this.uploadProgress = 100;
          this.fileUrl = response?.file?.url || '';
          this.fileId = response?.dbRecord?.data?.[0]?.insertId;
          this.isUploading = false;
          this.stage = 'done';
        });
      },
      error: () => {
        this.zone.run(() => {
          clearInterval(interval);
          this.isUploading = false;
          this.uploadProgress = 0;
          this.sharedservice.showAlert(2, 'Upload failed. Please try again.');
        });
      }
    });
  }

  resetToSelect(): void {
    this.stage = 'select';
    this.rawImage = null;
    this.rawFile = null;
    this.fileUrl = '';
    this.isUploading = false;
    this.uploadProgress = 0;
    this.removeListeners();
  }

  close(): void {
    if (this.fileUrl) {
      this.activeModal.close({ status: true, url: this.fileUrl, fileId: this.fileId });
    } else {
      this.activeModal.dismiss();
    }
  }
}
