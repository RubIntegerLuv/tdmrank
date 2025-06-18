import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { inject } from '@angular/core';

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

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private router: Router
  ) {}

  async unirseATorneo() {
    this.errorMsg = '';
    this.successMsg = '';
    const user = await this.authService.getCurrentUserData();

    if (!user) {
      this.errorMsg = 'Debes iniciar sesión para unirte a un torneo.';
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

    const jugadores = torneoData['jugadores'] || [];
    const maxJugadores = torneoData['jugadoresPorGrupo']
      ? torneoData['jugadoresPorGrupo'] * 4 // Suponiendo 4 grupos como máximo
      : 4;

    if (jugadores.some((j: any) => j.uid === user?.["uid"])) {
      this.errorMsg = 'Ya estás inscrito en este torneo.';
      return;
    }

    if (jugadores.length >= maxJugadores) {
      this.errorMsg = 'El torneo ya alcanzó su capacidad máxima.';
      return;
    }

    jugadores.push({
      uid: user?.["uid"],
      nombre: user?.["nombre"],
      apellido: user?.["apellido"],
      email: user?.["email"]
    });

    await updateDoc(torneoDocRef, { jugadores });

    this.successMsg = '¡Te has unido al torneo!';

    // Esperar un poco antes de redirigir
    await updateDoc(torneoDocRef, { jugadores });
    this.successMsg = '¡Te has unido al torneo!';
    // Redirige al torneo (tabs)
    this.router.navigate(['/torneo', torneoData['codigo']]);
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
