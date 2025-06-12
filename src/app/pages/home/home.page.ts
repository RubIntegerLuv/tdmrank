import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  usuario: any;

  constructor(private router: Router,
    private authService: AuthService,
    private menuCtrl: MenuController
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUserData();
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.menuCtrl.close('main-menu');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }
  createTourtnament() {
    this.router.navigate(['/create-tourtnament']);
  }
  createMatch() {
    this.router.navigate(['/create-match']);
  }
  joinMatch() {
    this.router.navigate(['/join-match']);
  }
  goToPerfil() {
    this.router.navigate(['/perfil']);
  }
}
