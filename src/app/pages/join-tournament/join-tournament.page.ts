import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-join-tournament',
  templateUrl: './join-tournament.page.html',
  styleUrls: ['./join-tournament.page.scss'],
  standalone: false
})
export class JoinTournamentPage {
  codigoTorneo: string = '';
  errorMsg: string = '';
  successMsg: string = '';
  rol: 'jugador' | 'arbitro' = 'jugador';
  torneoIniciado: boolean = false;
  torneoNombre: string = '';
  esperando: boolean = false;
  jugadores: any[] = [];
  arbitros: any[] = [];

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private router: Router
  ) {}

  async unirseATorneo() {
    this.errorMsg = '';
    this.successMsg = '';
    this.torneoIniciado = false;
    this.esperando = false;
    this.torneoNombre = '';
    this.jugadores = [];
    this.arbitros = [];

    const user = await this.authService.getCurrentUserData();

    if (!user) {
      this.errorMsg = 'Debes iniciar sesión para unirte a un torneo.';
      return;
    }

    if (!this.codigoTorneo) {
      this.errorMsg = 'Debes ingresar el código del torneo.';
      return;
    }

    const torneosRef = collection(this.firestore, 'torneos');
    const q = query(torneosRef, where('codigo', '==', this.codigoTorneo.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      this.errorMsg = 'No se encontró un torneo con ese código.';
      return;
    }

    const torneoDoc = querySnapshot.docs[0];
    const torneoDocRef = torneoDoc.ref;
    const torneoData = torneoDoc.data();

    this.torneoNombre = torneoData['nombre'] || '';
    this.torneoIniciado = torneoData['estado'] !== 'esperando';
    this.jugadores = torneoData['jugadores'] || [];
    this.arbitros = torneoData['arbitros'] || [];

    // Verifica si ya está inscrito como jugador o árbitro
    const yaJugador = this.jugadores.some((j: any) => j.uid === user['uid']);
    const yaArbitro = this.arbitros.some((a: any) => a.uid === user['uid']);

    if (this.rol === 'jugador' && yaJugador) {
      this.successMsg = 'Ya estás inscrito en este torneo como jugador.';
      this.esperando = !this.torneoIniciado;
      return;
    }
    if (this.rol === 'arbitro' && yaArbitro) {
      this.successMsg = 'Ya estás inscrito en este torneo como árbitro.';
      this.esperando = !this.torneoIniciado;
      return;
    }

    // Agrega al usuario al arreglo correspondiente
    if (this.rol === 'jugador') {
      this.jugadores.push({
        uid: user['uid'],
        nombre: user['nombre'],
        apellido: user['apellido'],
        email: user['email']
      });
      await updateDoc(torneoDocRef, { jugadores: this.jugadores });
      this.successMsg = '¡Te has unido al torneo como jugador!';
    } else if (this.rol === 'arbitro') {
      this.arbitros.push({
        uid: user['uid'],
        nombre: user['nombre'],
        apellido: user['apellido'],
        email: user['email']
      });
      await updateDoc(torneoDocRef, { arbitros: this.arbitros });
      this.successMsg = '¡Te has unido al torneo como árbitro!';
    }

    // Vuelve a cargar el estado para mostrar la espera si corresponde
    const torneoActualizado = (await getDocs(q)).docs[0].data();
    this.torneoIniciado = torneoActualizado['estado'] !== 'esperando';
    this.esperando = !this.torneoIniciado;
    this.jugadores = torneoActualizado['jugadores'] || [];
    this.arbitros = torneoActualizado['arbitros'] || [];
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
