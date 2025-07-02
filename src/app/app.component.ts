import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { Auth } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent {
  menuItems: { label: string; action: () => void }[] = [];
  usuario: any; // Variable para almacenar los datos del usuario actual

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private authService: AuthService,
    private auth: Auth,
    private toastCtrl: ToastController
  ) {
    // Escucha los cambios de autenticación
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('Usuario autenticado:', user);
        this.usuario = await this.authService.getCurrentUserData();
        console.log('Datos del usuario desde Firestore:', this.usuario);
        this.updateMenuItems(this.router.url); // Actualiza el menú con los datos del usuario
      } else {
        console.log('No hay usuario autenticado.');
        this.usuario = null;
        this.updateMenuItems(this.router.url); // Actualiza el menú para usuarios no autenticados
      }
    });

    // Escucha los cambios de ruta para actualizar el menú dinámicamente
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateMenuItems(event.url);
      }
    });
  }

  updateMenuItems(url: string) {
    if (url.includes('/home')) {
      this.menuItems = [
        // Opciones para el administrador
        ...(this.usuario?.tipoUsuario === 'administrador'
          ? [
              { label: 'Crear Torneo', action: () => this.router.navigate(['/create-tourtnament']) },
              { label: 'Unirse a Torneo', action: () => this.router.navigate(['/join-tournament']) },
            ]
          : []),
        // Opciones para el árbitro
        ...(this.usuario?.tipoUsuario === 'arbitro'
          ? [
              { label: 'Crear Partido', action: () => this.router.navigate(['/create-match']) },
              { label: 'Unirse a Torneo', action: () => this.router.navigate(['/join-tournament']) },
            ]
          : []),
        // Opciones para el jugador
        ...(this.usuario?.tipoUsuario === 'jugador'
          ? [
              { label: 'Unirse a Partido', action: () => this.router.navigate(['/join-match']) },
              { label: 'Unirse a Torneo', action: () => this.router.navigate(['/join-tournament']) },
              { label: 'Perfil', action: () => this.router.navigate(['/perfil']) },
            ]
          : []),
        // Opciones comunes para todos los usuarios
        { label: 'Ranking', action: () => this.router.navigate(['/ranking']) },
        { label: 'Cerrar Sesión', action: () => this.logout() },
      ];
    } else if (url.includes('/create-tourtnament') || url.includes('/create-match')) {
      this.menuItems = [
        { label: 'Ir a Inicio', action: () => this.router.navigate(['/home']) },
        { label: 'Cerrar Sesión', action: () => this.logout() },
      ];
    } else {
      this.menuItems = [
        { label: 'Ir a Inicio', action: () => this.router.navigate(['/home']) },
        { label: 'Cerrar Sesión', action: () => this.logout() },
      ];
    }

    console.log('Opciones del menú:', this.menuItems);
  }

   async logout() {
    try {
      await this.authService.logout();
      await this.menuCtrl.close('main-menu');
      this.router.navigate(['/login']);
      this.presentToast('Sesión cerrada correctamente.');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
