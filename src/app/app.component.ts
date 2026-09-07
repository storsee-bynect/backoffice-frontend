import { Component, HostListener } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SharedService } from './shared/services/shared.service';
import { SiteConfigService } from './shared/services/site-config.service';
import { PushService } from './shared/services/push.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'RESTRO-ADMIN';
  
  constructor(
    private router : Router,
    private sharedservice : SharedService,
    private siteconfigservice : SiteConfigService,
    private pushService: PushService
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        if (event.url) {
          this.sharedservice.givePermissionByUrl(event.url);
          this.sharedservice.applyDocumentTitle(this.sharedservice.pageName || 'Dashboard');
          if(event.url != '/login' && event.url != '/register'){
            if(!localStorage.getItem('admin_data')){
              this.router.navigate(['login']);
            }            
          }
        }
      }
    });
  }

  ngOnInit(): void {
    this.onResize(null);
    this.siteconfigservice.getIpAddress().subscribe((res : any) => {
      if(res){
        this.sharedservice.ip = res.query;
      }else{
        this.sharedservice.ip = '103.240.76.172';
      }
    }, err => {
      this.sharedservice.ip = '103.240.76.172';
    })
    this.siteconfigservice.getSiteConfig().subscribe((res : any) => {
      if(res){
        this.sharedservice.siteConfig = res.data[0];
        document.querySelector('body').classList.add(this.sharedservice.siteConfig.theme);
        this.sharedservice.applySiteBrand(this.sharedservice.pageName || 'Dashboard');
      }
      if (localStorage.getItem('admin_data')) {
        void this.pushService.syncIfGranted();
      }
    })
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event) {
      this.sharedservice.deviceWidth = event.target.innerWidth;
      this.sharedservice.deviceHeight = event.target.innerHeight;
    } else {
      this.sharedservice.deviceWidth = window.innerWidth;
      this.sharedservice.deviceHeight = window.innerHeight;
    }
  };
}