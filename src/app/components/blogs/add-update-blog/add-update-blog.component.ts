import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorConfig, ST_BUTTONS } from 'ngx-simple-text-editor';
import { SharedService } from '../../../shared/services/shared.service';
import { BlogReqModel } from '../blogs.model';
import { BlogsService } from '../blogs.service';

@Component({
  selector: 'app-add-update-blog',
  templateUrl: './add-update-blog.component.html',
  styleUrl: './add-update-blog.component.scss',
})
export class AddUpdateBlogComponent implements OnInit {
  @Input() isEdit = false;
  @Input() data: any;

  dataReqModel = new BlogReqModel();
  tagInput = '';
  tagChips: string[] = [];
  isSaving = false;
  isUploadingThumb = false;
  loadingFull = false;

  /** Locked 16:9 blog thumbnail */
  readonly thumbDims = { width: 1280, height: 720 };

  editorConfig: EditorConfig = {
    buttons: ST_BUTTONS,
  };

  constructor(
    public sharedservice: SharedService,
    private blogsService: BlogsService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    if (this.data?.id) {
      this.isEdit = true;
      this.loadingFull = true;
      this.blogsService
        .getById(this.data.id)
        .pipe(finalize(() => (this.loadingFull = false)))
        .subscribe({
          next: (res: any) => {
            const row = res?.data || this.data;
            this.patchForm(row);
          },
          error: () => this.patchForm(this.data),
        });
    }
  }

  private patchForm(row: any): void {
    this.dataReqModel.title = row.title || '';
    this.dataReqModel.slug = row.slug || '';
    this.dataReqModel.excerpt = row.excerpt || '';
    this.dataReqModel.content = row.content || '';
    this.dataReqModel.thumbnail = row.thumbnail || '';
    this.dataReqModel.status = Number(row.status) === 0 ? 0 : 1;
    this.tagChips = String(row.tags || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  async uploadThumbnail(): Promise<void> {
    if (this.isUploadingThumb) return;
    this.isUploadingThumb = true;
    try {
      const result = await this.sharedservice.UploadFile('blogs', this.thumbDims);
      if (result?.url) {
        this.dataReqModel.thumbnail = result.url;
      }
    } finally {
      this.isUploadingThumb = false;
    }
  }

  removeThumbnail(): void {
    this.dataReqModel.thumbnail = '';
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  addTag(): void {
    const raw = this.tagInput.trim().replace(/,/g, '');
    if (!raw) return;
    const exists = this.tagChips.some((t) => t.toLowerCase() === raw.toLowerCase());
    if (!exists) this.tagChips.push(raw);
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tagChips = this.tagChips.filter((t) => t !== tag);
  }

  private slugify(text: string): string {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  validateData(): void {
    this.addTag();
    let errTxt = '';
    if (!this.dataReqModel.title?.trim()) errTxt += 'Enter Title<br/>';
    if (!this.dataReqModel.content?.trim()) errTxt += 'Enter Content<br/>';
    if (!this.dataReqModel.thumbnail?.trim()) errTxt += 'Upload a 16:9 thumbnail<br/>';

    if (errTxt) {
      this.sharedservice.showAlert(2, errTxt);
      return;
    }

    this.dataReqModel.tags = this.tagChips.join(', ');
    if (!this.dataReqModel.slug?.trim()) {
      this.dataReqModel.slug = this.slugify(this.dataReqModel.title);
    }

    if (this.isEdit) this.updateData();
    else this.addData();
  }

  addData(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.blogsService
      .add(this.dataReqModel)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res) => {
          if (res) {
            this.sharedservice.showAlert(1, 'Blog Added Successfully');
            this.activeModal.close(true);
          } else {
            this.sharedservice.showAlert(2, 'Something Went Wrong');
          }
        },
        error: (err) => {
          if (err.status === 401) this.activeModal.close();
          else this.sharedservice.showAlert(2, err?.error?.message || 'Something Went Wrong');
        },
      });
  }

  updateData(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.blogsService
      .update(this.data.id, this.dataReqModel)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (res) => {
          if (res) {
            this.sharedservice.showAlert(1, 'Blog Updated Successfully');
            this.activeModal.close(true);
          } else {
            this.sharedservice.showAlert(2, 'Something Went Wrong');
          }
        },
        error: (err) => {
          if (err.status === 401) this.activeModal.close();
          else this.sharedservice.showAlert(2, err?.error?.message || 'Something Went Wrong');
        },
      });
  }
}
