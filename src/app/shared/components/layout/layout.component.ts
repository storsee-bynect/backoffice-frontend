import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';
import {environment} from '../../environment/environment';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit,OnDestroy {
  private navigationRequest?:Subscription;
  ngOnInit(){if(!localStorage.getItem('admin_token'))return;this.navigationRequest=this.http.get<any>(environment.APIUrl+'users/navigation').subscribe({next:res=>{if(!Array.isArray(res.pages))return;this.sharedservice.sidebarPages=res.pages;localStorage.setItem('admin_pages',btoa(unescape(encodeURIComponent(JSON.stringify(res.pages)))));this.sharedservice.givePermissionByUrl(window.location.pathname);},error:()=>{}});}
  ngOnDestroy(){this.navigationRequest?.unsubscribe();}

  constructor(public sharedservice : SharedService,private http:HttpClient){}

}
