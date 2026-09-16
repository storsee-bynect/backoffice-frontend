import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ViewImageComponent } from '../components/view-image/view-image.component';
import { ViewContentComponent } from '../components/view-content/view-content.component';
import { ViewLocationComponent } from '../components/view-location/view-location.component';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';

@Injectable({
    providedIn: 'root'
})

export class SharedService {
    isSidebarOpen: boolean = true;
    siteConfig: any;
    userData: any;
    ip: any;
    sidebarPages: any[] = [];

    deviceWidth: number;
    deviceHeight: number;

    constructor(private router : Router, private modalservice : NgbModal, private toastr: ToastrService) {
        if (localStorage.getItem('admin_data')) {
            this.userData = JSON.parse(atob(localStorage.getItem('admin_data')));
            console.log('this.userData -->',this.userData);
        }
        let sidebarEncoded = localStorage.getItem('admin_pages');
        if(sidebarEncoded){
        let decodedJSON = atob(sidebarEncoded);    
        if(decodedJSON){
            let parsedJSON = JSON.parse(String(decodedJSON));
            this.sidebarPages = parsedJSON;            
        }else{
            this.logout();
        }
        }
    }

    logout(){
        localStorage.removeItem('admin_data');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_pages');
        this.router.navigate(['/login']);
    }

    /** Colorful logo for white / light backgrounds */
    getSiteLogoLight(fallback = 'assets/img/transparent.png'): string {
        return this.siteConfig?.logo || this.siteConfig?.white_logo || fallback;
    }

    /** White / light logo for dark backgrounds */
    getSiteLogoDark(fallback = 'assets/img/transparent.png'): string {
        return this.siteConfig?.white_logo || this.siteConfig?.logo || fallback;
    }

    hasWhiteLogo(): boolean {
        return !!this.siteConfig?.white_logo;
    }

    applyFavicon(url?: string | null): void {
        const href = String(url || this.siteConfig?.icon || '').trim();
        if (!href || typeof document === 'undefined') return;
        const links = Array.from(
            document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
        ) as HTMLLinkElement[];
        let link = links[0];
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'icon');
            document.head.appendChild(link);
        }
        const lower = href.toLowerCase();
        link.type = lower.includes('.svg')
            ? 'image/svg+xml'
            : lower.includes('.webp')
              ? 'image/webp'
              : lower.includes('.jpg') || lower.includes('.jpeg')
                ? 'image/jpeg'
                : 'image/png';
        link.href = href;
        links.slice(1).forEach((extra) => extra.parentElement?.removeChild(extra));
    }

    getSiteBrandName(): string {
        return String(this.siteConfig?.siteName || '').trim() || 'Admin Panel';
    }

    applyDocumentTitle(pageTitle?: string | null): void {
        if (typeof document === 'undefined') return;
        const site = this.getSiteBrandName();
        const page = String(pageTitle || this.pageName || '').trim();
        document.title = page && page !== site ? `${page} | ${site}` : site;
    }

    applySiteBrand(pageTitle?: string | null): void {
        this.applyFavicon(this.siteConfig?.icon);
        this.applyDocumentTitle(pageTitle);
    }

    showAlert(type : number, title : string , message? : string) {
        if(type == 1){
            this.toastr.success(title, message ? message : '', {
                enableHtml : true,
                progressBar : true,
                positionClass: 'toast-bottom-right'
            });
        }else if(type == 2){
            this.toastr.warning(title, message ? message : '', {
                enableHtml : true,
                progressBar : true,
                positionClass: 'toast-bottom-right'
            });
        }else if(type == 3){
            this.toastr.error(title, message ? message : '', {
                enableHtml : true,
                progressBar : true,
                positionClass: 'toast-bottom-right'
            });
        }else if(type == 4){
            this.toastr.info(title, message ? message : '', {
                enableHtml : true,
                progressBar : true,
                positionClass: 'toast-bottom-right'
            });
        }
    }

    viewContent(data) {
        const modalRef = this.modalservice.open(ViewContentComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = data;
    }
    viewImage(data) {
        const modalRef = this.modalservice.open(ViewImageComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = data;
    }
    viewLocation(latitude , longitude) {
        const modalRef = this.modalservice.open(ViewLocationComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
        });
        modalRef.componentInstance.data = {latitude , longitude};
    }
    copyText(val: string) {
        const selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = val;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);
        document.getElementById('copy-data-text').innerHTML = 'Copied!';
    }
    openURL(url) {
        window.open(url, '_blank');
    }

    pageName: any;
    pageDetail: any;
    isPageView: boolean = false;
    isPageInsert: boolean = false;
    isPageUpdate: boolean = false;
    isPageDelete: boolean = false;

    /** Normalize admin route for permission lookup */
    normalizeAdminPath(url: string): string {
        let s = String(url || '').split('?')[0].split('#')[0].trim();
        if (!s) return '';
        if (!s.startsWith('/')) s = '/' + s;
        if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
        return s.toLowerCase();
    }

    givePermissionByUrl(url: string) {
        const path = this.normalizeAdminPath(url);
        this.isPageView = false;
        this.isPageInsert = false;
        this.isPageUpdate = false;
        this.isPageDelete = false;
        this.pageName = '';
        this.pageDetail = null;

        if (!path || path === '/login' || path === '/register') return;

        const allPages: any[] = [];
        (this.sidebarPages || []).forEach((e: any) => {
            (e?.pages || []).forEach((f: any) => allPages.push(f));
        });

        const findPage = allPages.find(
            (f) => this.normalizeAdminPath(f?.url) === path
        );
        if (!findPage) return;

        const action = Number(findPage.action) || 0;
        this.pageName = findPage.pagename;
        this.pageDetail = findPage;
        this.isPageView = Boolean(action & 1);
        this.isPageInsert = Boolean(action & 2);
        this.isPageUpdate = Boolean(action & 4);
        this.isPageDelete = Boolean(action & 8);
    }

    async UploadFile(directory: string, dimentions?: { width: number; height: number }): Promise<any | null> {
        const modalRef = this.modalservice.open(FileUploadComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true,
        });
        modalRef.componentInstance.directory = directory;
        if (dimentions) {
            modalRef.componentInstance.dimentions = dimentions;
        }
        try {
            const result = await modalRef.result;
            if (result && result.status) {
                return { url: result.url, fileId: result.fileId };
            }
            return null;
        } catch {
            return null;
        }
    }

    shareUrlToSocial(platform_name, url) {        let shareUrl = '';
      
        switch (platform_name.toLowerCase()) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
          case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
            break;
          case 'reddit':
            shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=Check this out!`;
            break;
          default:
            this.showAlert(2,'Unsupported Platform');
            return;
        }
      
        window.open(shareUrl, '_blank');
      }
}