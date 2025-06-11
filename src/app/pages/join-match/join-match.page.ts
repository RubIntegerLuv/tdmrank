import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-join-match',
  templateUrl: './join-match.page.html',
  styleUrls: ['./join-match.page.scss'],
  standalone: false
})
export class JoinMatchPage implements OnInit {
  codigoPartido: string = '';
  errorMsg: string = '';
  partidoEncontrado: boolean = false;
  partidoId: string = '';
  jugadores: any[] = [];
  usuario: any;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
    private menuCtrl: MenuController
  ) {}

  async ngOnInit() {
  if (this.partidoId) {
      this.escucharEstadoPartido();
    }
  }

  async unirseAPartido() {
    this.errorMsg = '';
    this.partidoEncontrado = false;
    this.codigoPartido = this.codigoPartido.toUpperCase();
    this.usuario = await this.authService.getCurrentUserData();

    // Buscar partido por código
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('codigo', '==', this.codigoPartido));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      this.errorMsg = 'No se encontró un partido con ese código.';
      return;
    }

    const partidoDocRef = querySnapshot.docs[0].ref;
    this.partidoId = querySnapshot.docs[0].id;

    // Obtener datos actuales
    const partidoData = querySnapshot.docs[0].data();
    this.jugadores = partidoData['jugadores'] || [];

    // Verificar si ya está unido
    if (this.jugadores.some((j: any) => j.uid === this.usuario.uid)) {
      this.errorMsg = 'Ya estás unido a este partido.';
      this.partidoEncontrado = true;
    } else if (this.jugadores.length >= 2) {
      this.errorMsg = 'El partido ya tiene el máximo de jugadores.';
    } else {
      // Agregar jugador con nombre y apellido
      const nuevosJugadores = [
        ...this.jugadores,
        {
          uid: this.usuario.uid,
          nombre: `${this.usuario.nombre} ${this.usuario.apellido}`
        }
      ];
      await updateDoc(partidoDocRef, { jugadores: nuevosJugadores });
      this.partidoEncontrado = true;
      this.jugadores = nuevosJugadores;
    }

    // Escuchar en tiempo real los jugadores conectados y el estado del partido
    this.escucharEstadoPartido();
  }

  escucharEstadoPartido() {
    onSnapshot(doc(this.firestore, `partidos/${this.partidoId}`), (snapshot) => {
      const data = snapshot.data();
      this.jugadores = data ? data['jugadores'] || [] : [];
      if (data && data['estado'] === 'en_juego') {
        this.router.navigate(['/partido', this.partidoId]);
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
}
