import { Component, OnDestroy, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-join-tournament',
  templateUrl: './join-tournament.page.html',
  styleUrls: ['./join-tournament.page.scss'],
  standalone: false
})
export class JoinTournamentPage implements OnInit, OnDestroy {
  codigoTorneo: string = '';
  errorMsg: string = '';
  successMsg: string = '';
  torneoIniciado: boolean = false;
  torneoNombre: string = '';
  esperando: boolean = false;
  jugadores: any[] = [];
  arbitros: any[] = [];
  user: User | null = null;
  torneoDocId: string = '';
  torneoCodigo: string = '';
  unsubscribe: any;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUserData() as User | null;
  }

  async unirseATorneo() {
    this.errorMsg = '';
    this.successMsg = '';
    this.torneoIniciado = false;
    this.esperando = false;
    this.torneoNombre = '';
    this.jugadores = [];
    this.arbitros = [];

    if (!this.user) {
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
    this.torneoDocId = torneoDoc.id;
    const torneoDocRef = torneoDoc.ref;
    const torneoData = torneoDoc.data();

    this.torneoNombre = torneoData['nombre'] || '';
    this.torneoCodigo = torneoData['codigo'];
    this.torneoIniciado = torneoData['estado'] !== 'esperando';
    this.jugadores = torneoData['jugadores'] || [];
    this.arbitros = torneoData['arbitros'] || [];

    const esJugador = this.user.tipoUsuario === 'jugador';
    const esArbitro = this.user.tipoUsuario === 'arbitro';
    const esAdmin = this.user.tipoUsuario === 'admin' || this.user.tipoUsuario === 'administrador';

    const yaJugador = this.jugadores.some((j: any) => j.uid === this.user!.uid);
    const yaArbitro = this.arbitros.some((a: any) => a.uid === this.user!.uid);

    if (esJugador && yaJugador) {
      this.successMsg = 'Ya estás inscrito en este torneo como jugador.';
      this.esperando = !this.torneoIniciado;
      this.suscribirCambiosTorneo();
      return;
    }
    if (esArbitro && yaArbitro) {
      this.successMsg = 'Ya estás inscrito en este torneo como árbitro.';
      this.esperando = !this.torneoIniciado;
      this.suscribirCambiosTorneo();
      return;
    }
    if (esAdmin && yaJugador) {
      this.successMsg = 'Ya estás inscrito en este torneo como administrador.';
      this.esperando = !this.torneoIniciado;
      this.suscribirCambiosTorneo();
      return;
    }

    if (esJugador || esAdmin) {
      this.jugadores.push({
        uid: this.user.uid,
        nombre: this.user.nombre,
        apellido: this.user.apellido,
        email: this.user.email
      });
      await updateDoc(torneoDocRef, { jugadores: this.jugadores });
      this.successMsg = esAdmin
        ? '¡Te has unido al torneo como administrador!'
        : '¡Te has unido al torneo como jugador!';
    } else if (esArbitro) {
      this.arbitros.push({
        uid: this.user.uid,
        nombre: this.user.nombre,
        apellido: this.user.apellido,
        email: this.user.email
      });
      await updateDoc(torneoDocRef, { arbitros: this.arbitros });
      this.successMsg = '¡Te has unido al torneo como árbitro!';
    } else {
      this.errorMsg = 'Tu usuario no tiene un rol válido para unirse al torneo.';
      return;
    }

    this.suscribirCambiosTorneo();
  }

  suscribirCambiosTorneo() {
    if (!this.torneoDocId) return;
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoDocId);
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = onSnapshot(torneoDoc, (snap) => {
      const data = snap.data();
      this.torneoIniciado = data?.['estado'] !== 'esperando';
      this.jugadores = data?.['jugadores'] || [];
      this.arbitros = data?.['arbitros'] || [];
      this.esperando = !this.torneoIniciado;
      this.torneoCodigo = data?.['codigo'];

      // Redirección automática cuando inicia el torneo
      if (this.torneoIniciado && this.torneoDocId) {
        this.router.navigate(['/torneo', this.torneoDocId]);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
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
