import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-torneo',
  templateUrl: './torneo.page.html',
  styleUrls: ['./torneo.page.scss'],
  standalone: false
})
export class TorneoPage {
  vistaSeleccionada = 'mis-partidos';

  constructor(private router: Router, private route: ActivatedRoute) {}

  cambiarVista(event: any) {
    const value = event.detail ? event.detail.value : event;
    this.router.navigate([value], { relativeTo: this.route });
  }

  ngOnInit() {
    // Mantener el tab activo según la url
    const child = this.route.firstChild;
    if (child && child.snapshot.url.length > 0) {
      this.vistaSeleccionada = child.snapshot.url[0].path;
    }
  }
}
