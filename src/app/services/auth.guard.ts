import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const user = this.auth.currentUser;
    if (user) {
      return true;
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Debes iniciar sesión para acceder.',
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
      return this.router.parseUrl('/login');
    }
  }
}
