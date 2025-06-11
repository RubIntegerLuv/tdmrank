import { HomePage } from './../home/home.page';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-create-tourtnament',
  templateUrl: './create-tourtnament.page.html',
  styleUrls: ['./create-tourtnament.page.scss'],
  standalone: false
})
export class CreateTourtnamentPage implements OnInit {

  constructor(private router: Router,
    private authService: AuthService,
    private menuCtrl: MenuController
  ) {}

  ngOnInit() {
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
  goHome() {
    this.router.navigate(['/home']);
  }
}
