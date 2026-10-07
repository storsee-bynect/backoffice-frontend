import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { routing } from './shared/routes/routes';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './shared/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: "full"
  }, {
    path: 'login',
    component: LoginComponent
  }, {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: routing
  }, {
    path: '**',
    redirectTo: 'page-not-found'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
