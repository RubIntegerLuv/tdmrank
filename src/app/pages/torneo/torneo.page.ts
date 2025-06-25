import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-torneo',
  templateUrl: './torneo.page.html',
  styleUrls: ['./torneo.page.scss'],
  standalone: false
})
export class TorneoPage implements OnInit {
  vistaSeleccionada = 'mis-partidos';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private menuCtrl: MenuController
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const child = this.route.firstChild;
        if (child && child.snapshot.url.length > 0) {
          this.vistaSeleccionada = child.snapshot.url[0].path;
        }
      });
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

  cambiarVista(event: any) {
    const value = event.detail ? event.detail.value : event;
    this.router.navigate([value], { relativeTo: this.route });
  }
}
