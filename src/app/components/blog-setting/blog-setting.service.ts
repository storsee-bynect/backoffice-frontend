import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../shared/environment/environment';
export interface StoreAppItem {code:string;name:string;enabled:boolean;settings:{postingMode:'manual'|'auto'};connection?:{connected:boolean;authorized:boolean;accountName:string;targetId:string;targetName:string};}
@Injectable({providedIn:'root'})
export class StoreAppsService {
  constructor(private http:HttpClient){}
  private get base(){return environment.APIUrl+'platform-blog-publishing/';}
  list(){return this.http.get<{data:StoreAppItem[]}>(this.base);}
  update(code:string,body:{enabled?:boolean;settings?:{postingMode:'manual'|'auto'}}){return this.http.patch<{data:StoreAppItem}>(this.base+code,{...(body.enabled===undefined ? {} : {enabled:body.enabled}),...(body.settings ? {postingMode:body.settings.postingMode} : {})});}
  startBlogger(){return this.http.post<any>(this.base+'blogger/start',{});}
  bloggerBlogs(){return this.http.get<any>(this.base+'blogger/blogs');}
  selectBlog(blogId:string){return this.http.post<any>(this.base+'blogger/target',{blogId});}
  disconnect(code:string){return this.http.delete<any>(this.base+code+'/connection');}
  publish(code:string,id:number){return this.http.post<any>(this.base+code+'/posts/'+id,{});}
  get callbackOrigin(){return new URL(this.base,window.location.origin).origin;}
}
