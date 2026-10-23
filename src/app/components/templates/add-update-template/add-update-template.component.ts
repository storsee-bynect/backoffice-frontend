import { Component, Input, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { TemplateReqModel } from '../templates.model';
import { SharedService } from '../../../shared/services/shared.service';
import { TemplateService } from '../templates.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemeCategoryService } from '../../theme-category/theme-category.service';
import { FileUploadService } from '../../../shared/components/file-upload/file-upload.service';

@Component({
  selector: 'app-add-update-template',
  templateUrl: './add-update-template.component.html',
  styleUrl: './add-update-template.component.scss'
})
export class AddUpdateTemplateComponent implements OnInit {
  @Input() isEdit;
  @Input() data;
  categoryList: any[] = [];
  dataReqModel: TemplateReqModel = new TemplateReqModel();
  isSystemDefault = false;
  isSaving = false;
  isUploading = false;

  constructor(
    public sharedservice: SharedService,
    private templateservice: TemplateService,
    private themecategoryservice: ThemeCategoryService,
    public activeModal: NgbActiveModal,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    this.getCategories();
    if (this.data) {
      this.isEdit = true;
      this.isSystemDefault = !!this.data.isDefault || this.data.uniqueCode === 'DEFAULT';
      Object.assign(this.dataReqModel, {
        name: this.data.name,
        categoryId: this.data.categoryId,
        uniqueCode: this.data.uniqueCode,
        tagline: this.data.tagline || '',
        description: this.data.description || '',
        price: Number(this.data.price || 0),
        isFree: !!this.data.isFree,
        thumbnail: this.data.thumbnail,
        previewUrl: this.data.previewUrl || '',
        isActive: !!this.data.isActive,
        sortOrder: Number(this.data.sortOrder || 0),
      });
    }
  }

  onFreeToggle() {
    if (this.dataReqModel.isFree) {
      this.dataReqModel.price = 0;
    }
  }

  getCategories() {
    this.themecategoryservice.getThemeCategoryList().subscribe((res: any) => {
      if (res) this.categoryList = res.data;
    });
  }

  validateData() {
    if(this.isUploading || this.isSaving)return;
    let errTxt = '';
    if (!this.dataReqModel.name) errTxt += 'Enter Name <br/>';
    if (!this.dataReqModel.uniqueCode) errTxt += 'Enter Unique Code <br/>';
    if (!this.dataReqModel.thumbnail) errTxt += 'Upload Thumbnail <br/>';
    if (!this.dataReqModel.isFree && !this.dataReqModel.price && !this.isSystemDefault) {
      errTxt += 'Enter price for paid template <br/>';
    }

    if (errTxt === '') {
      this.dataReqModel.uniqueCode = this.dataReqModel.uniqueCode.toUpperCase();
      this.isEdit ? this.updateData() : this.addData();
    } else {
      this.sharedservice.showAlert(2, errTxt);
    }
  }

  addData() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.templateservice.addTemplate(this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Template created');
        this.activeModal.close(true);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Something went wrong';
        this.sharedservice.showAlert(2, msg);
        if (err.status === 401) this.activeModal.close();
      }
    });
  }

  updateData() {
    if (this.isSaving) return;
    this.isSaving = true;
    this.templateservice.updateTemplate(this.data.id, this.dataReqModel).pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        this.sharedservice.showAlert(1, 'Template updated');
        this.activeModal.close(true);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Something went wrong';
        this.sharedservice.showAlert(2, msg);
        if (err.status === 401) this.activeModal.close();
      }
    });
  }

  uploadImage(event) {
    const input=event.target as HTMLInputElement;
    const imagePath = input.files?.[0];
    if (!imagePath) return;
    input.value='';
    if(this.isUploading || this.isSaving)return;
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(imagePath.type)) {
      this.sharedservice.showAlert(2, 'Upload PNG/JPG/WEBP');
      return;
    }
    if(imagePath.size>25*1024*1024){this.sharedservice.showAlert(2,'Image must be smaller than 25 MB');return;}
    this.isUploading=true;
    this.fileUploadService.uploadFile(imagePath,'templates/thumbnails').pipe(finalize(()=>this.isUploading=false)).subscribe({
      next:(res:any)=>{
        const url=res?.file?.url;
        if(typeof url!=='string' || !/^https?:\/\//i.test(url)){this.sharedservice.showAlert(2,'Upload did not return an image URL. Please try again.');return;}
        this.dataReqModel.thumbnail=url;
      },
      error:(err)=>this.sharedservice.showAlert(2,err?.error?.message || 'Image upload failed. Please try again.')
    });
  }
}
