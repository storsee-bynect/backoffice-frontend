import { Component } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { siteConfigReqModel } from './site-configuration.model';
import { SharedService } from '../../shared/services/shared.service';
import { SiteConfigService } from './site-configuration.service';

@Component({
  selector: 'app-site-configuration',
  templateUrl: './site-configuration.component.html',
  styleUrl: './site-configuration.component.scss'
})
export class SiteConfigurationComponent {
  isDataLoaded : boolean = false;
  isSaving = false;
  siteConfig : siteConfigReqModel = new siteConfigReqModel();
 
  constructor(public sharedservice : SharedService , private siteconfigservice : SiteConfigService){}

  ngOnInit(): void {
    this.getSiteConfig();
  }
  
  getSiteConfig(){
    this.siteconfigservice.getSiteConfig().subscribe((res : any) => {
      let config = res.data[0];
      this.siteConfig.logo = config.logo;
      this.siteConfig.white_logo = config.white_logo;
      this.siteConfig.icon = config.icon;
      this.siteConfig.siteName = config.siteName;
      this.siteConfig.mobile = config.mobile;
      this.siteConfig.email = config.email;
      this.siteConfig.theme = config.theme;
      this.siteConfig.parentCompany = config.parentCompany;
      this.siteConfig.storeBaseUrl = config.storeBaseUrl;
      this.siteConfig.cnameDomain = config.cnameDomain;
      this.siteConfig.version = config.version;

      this.siteConfig.facebookURL = config.facebookURL;
      this.siteConfig.instagramURL = config.instagramURL;
      this.siteConfig.linkedInURL = config.linkedInURL;
      this.siteConfig.twitterURL = config.twitterURL;
      this.siteConfig.youtubeURL = config.youtubeURL;
      
      this.siteConfig.enableMaintananceMode = config.enableMaintananceMode;
      this.siteConfig.enableStoreRegister = config.enableStoreRegister;
      this.isDataLoaded = true;
    })
  }
  
  updateSiteConfig(){
    let errTxt = '';

    if (!this.siteConfig.logo) {
      errTxt += 'Upload Logo <br/>';
    }
    if (!this.siteConfig.siteName) {
      errTxt += 'Enter Site Name <br/>';
    }
    if (!this.siteConfig.theme) {
      errTxt += 'Select Theme <br/>';
    }
    if (!this.siteConfig.parentCompany) {
      errTxt += 'Select Parent Company <br/>';
    }
    if (!this.siteConfig.storeBaseUrl) {
      errTxt += 'Enter Store Base URL <br/>';
    }
    if (!this.siteConfig.cnameDomain) {
      errTxt += 'Enter Store CNAME (e.g. store.storsee.com) <br/>';
    }
    if (!this.siteConfig.version) {
      errTxt += 'Select Version <br/>';
    }
    if (!this.siteConfig.email) {
      errTxt += 'Enter Email <br/>';
    }else{
      if (String(this.siteConfig.email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) { } else {
        errTxt += 'Enter Valid Email<br/>';
      }
    }
    if (!this.siteConfig.mobile) {
      errTxt += 'Enter Mobile <br/>';
    }else{
      if(String(this.siteConfig.mobile).length != 10){
        errTxt += 'Enter Valid Mobile <br/>';
      }
    }
    if (!this.siteConfig.instagramURL) {
      errTxt += 'Enter Instagram URL <br/>';
    }
    if (!this.siteConfig.facebookURL) {
      errTxt += 'Enter Facebook URL <br/>';
    }
    if (!this.siteConfig.twitterURL) {
      errTxt += 'Enter Twitter URL <br/>';
    }
    if (!this.siteConfig.linkedInURL) {
      errTxt += 'Enter Linkedin URL <br/>';
    }
    if (!this.siteConfig.youtubeURL) {
      errTxt += 'Enter Youtube URL <br/>';
    }
    
    if (errTxt == '') {
      if (this.isSaving) return;
      this.isSaving = true;
      this.siteconfigservice.updateSiteConfig(this.siteConfig).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe((res : any) => {
        if(res){
          this.sharedservice.showAlert(1,'Configuration Updated Successfully');
        }else{
          this.sharedservice.showAlert(2,'Something Went Wrong')
        }
      }, err => {
        this.sharedservice.showAlert(2,'Technical Issue Found !')
      })
    } else {
      this.sharedservice.showAlert(2, errTxt);
    }
  }
  
  uploadImage(event) {
    this.uploadBrandLogo(event, 'logo', 'Upload (500 x 150) Logo!');
  }

  uploadWhiteLogo(event) {
    this.uploadBrandLogo(event, 'white_logo', 'Upload (500 x 150) White Logo!');
  }

  private uploadBrandLogo(event, field: 'logo' | 'white_logo', sizeErrMsg: string) {
    const reader = new FileReader();
    let imagePath = event.target.files[0];
    if (imagePath.type == 'image/png' || imagePath.type == 'image/jpeg' || imagePath.type == 'image/jpg' || imagePath.type == 'image/webp') {
        reader.readAsDataURL(imagePath);
        reader.onload = (e) => {
            const Img = new Image();
            Img.src = URL.createObjectURL(event.target.files[0]);
            Img.onload = (e: any) => {
              const h = e.target.height;
              const w = e.target.width;
              
              if(h == 150 && w == 500){
                this.siteConfig[field] = String(reader.result);
              }else{
                this.sharedservice.showAlert(2, sizeErrMsg);
              }
            };
        };
    } else {
        this.sharedservice.showAlert(2,'Upload PNG/JPG/WEBP Logo!');
    }
  }
  uploadIcon(event) {
    const reader = new FileReader();
    let imagePath = event.target.files[0];
    if (imagePath.type == 'image/png' || imagePath.type == 'image/jpeg' || imagePath.type == 'image/jpg' || imagePath.type == 'image/webp') {
        reader.readAsDataURL(imagePath);
        reader.onload = (e) => {
            const Img = new Image();
            Img.src = URL.createObjectURL(event.target.files[0]);
            Img.onload = (e: any) => {
              const h = e.target.height;          
              const w = e.target.width;
              
              if(h == w){
                this.siteConfig.icon = String(reader.result);
              }else{
                this.sharedservice.showAlert(2,'Upload (512 x 512) Icon!');
              }             
            };
        };
    } else {
        this.sharedservice.showAlert(2,'Upload PNG/JPG/WEBP Logo!');
    }
  }
}