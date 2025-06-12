import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {
  urlImagenPerfil: string = '';
  jugador: any = {};
  partidosGanados: number = 0;
  torneosGanados: number = 0;
  porcentajeVictorias: number = 0;

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.cargarDatosJugador();
    await this.cargarEstadisticas();
  }

  async cargarDatosJugador() {
    const user = await this.authService.getCurrentUserData();
    if (!user) {
      return;
    }
    this.jugador = user;
    this.urlImagenPerfil = user['fotoURL'] || '';
  }

  async cargarEstadisticas() {
    const userId = this.jugador.uid;

    // PARTIDOS GANADOS Y JUGADOS
    const partidosRef = collection(this.firestore, 'partidos');
    const qGanados = query(partidosRef, where('ganadorUid', '==', userId));
    const qJugados = query(partidosRef, where('jugadores', 'array-contains', userId));

    const partidosGanadosSnap = await getDocs(qGanados);
    const partidosJugadosSnap = await getDocs(qJugados);

    this.partidosGanados = partidosGanadosSnap.size;
    const partidosJugados = partidosJugadosSnap.size;
    this.porcentajeVictorias = partidosJugados > 0 ? Math.round((this.partidosGanados / partidosJugados) * 100) : 0;

    // TORNEOS GANADOS
    const torneosRef = collection(this.firestore, 'torneos');
    const qTorneos = query(torneosRef, where('ganadorUid', '==', userId));
    const torneosGanadosSnap = await getDocs(qTorneos);
    this.torneosGanados = torneosGanadosSnap.size;
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const userId = this.jugador.uid;
    const storageRef = ref(this.storage, `perfiles/${userId}/foto.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Actualiza la URL en el perfil del usuario en Firestore
    const userDoc = doc(this.firestore, `users/${userId}`);
    await updateDoc(userDoc, { fotoURL: url });
    this.urlImagenPerfil = url;
  }
}
