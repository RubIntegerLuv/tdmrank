import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, setDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface RankingJugador {
  uid: string;
  nombre: string;
  apellido: string;
  partidosGanados: number;
  partidosJugados: number;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {
  usuario: any;
  urlImagenPerfil: string = '';
  jugador: any = {};
  partidosGanados: number = 0;
  torneosGanados: number = 0;
  porcentajeVictorias: number = 0;
  porcentajeVictoriasMes: number = 0;
  historialPartidos: any[] = [];
  ranking: any[] = [];
  posicionRanking: number | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('ngOnInit inicia');
    await this.cargarDatosJugador();
    console.log('Después de cargarDatosJugador');
    try {
      await this.cargarEstadisticas();
      console.log('Después de cargarEstadisticas');
      await this.cargarHistorialPartidos();
      console.log('Después de cargarHistorialPartidos');
      await this.cargarRankingPersonal();
      console.log('Después de cargarRankingPersonal');
    } catch (e) {
      console.error('Error en ngOnInit:', e);
    }
  }


  async cargarDatosJugador() {
    const user = await this.authService.getCurrentUserData();
    console.log('Usuario cargado:', user);
    if (!user) {
      return;
    }
    this.jugador = user;
    this.urlImagenPerfil = user['fotoURL'] || '';
  }

  async cargarEstadisticas() {
    try {
      const userId = this.jugador.uid;
      if (!userId) {
        console.error('userId es undefined en cargarEstadisticas');
        return;
      }

      const partidosRef = collection(this.firestore, 'partidos');
      const partidosSnap = await getDocs(partidosRef);

      let partidosJugados = 0;
      let partidosGanados = 0;
      let partidosJugadosMes = 0;
      let partidosGanadosMes = 0;

      // Fecha de inicio del mes actual
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

      partidosSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data['jugadores'] && data['jugadores'].some((j: any) => j['uid'] === userId)) {
          partidosJugados++;
          if (data['ganadorUid'] === userId) {
            partidosGanados++;
          }

          // Verifica si el partido es de este mes
          let fechaPartido: Date | null = null;
          if (data['creadoEn']?.toDate) {
            fechaPartido = data['creadoEn'].toDate();
          } else if (data['creadoEn'] instanceof Date) {
            fechaPartido = data['creadoEn'];
          }
          if (fechaPartido && fechaPartido >= inicioMes) {
            partidosJugadosMes++;
            if (data['ganadorUid'] === userId) {
              partidosGanadosMes++;
            }
          }
        }
      });

      this.partidosGanados = partidosGanados;
      this.porcentajeVictorias = partidosJugados > 0 ? Math.round((partidosGanados / partidosJugados) * 100) : 0;
      this.porcentajeVictoriasMes = partidosJugadosMes > 0 ? Math.round((partidosGanadosMes / partidosJugadosMes) * 100) : 0;

      // Bloque de torneos comentado:

      const torneosRef = collection(this.firestore, 'torneos');
      const qTorneos = query(torneosRef, where('ganadorUid', '==', userId));
      const torneosGanadosSnap = await getDocs(qTorneos);
      this.torneosGanados = torneosGanadosSnap.size;
    } catch (e) {
      console.error('Error en cargarEstadisticas:', e);
      throw e;
    }
  }

  async cargarHistorialPartidos() {
    const userId = this.jugador.uid;
    const partidosRef = collection(this.firestore, 'partidos');
    const partidosSnap = await getDocs(partidosRef);

    this.historialPartidos = [];

    partidosSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data['jugadores'] && Array.isArray(data['jugadores'])) {
        const idx = data['jugadores'].findIndex((j: any) => j['uid'] === userId);
        if (idx !== -1 && data['jugadores'].length > 1) {
          const oponenteIdx = idx === 0 ? 1 : 0;
          const oponente = data['jugadores'][oponenteIdx];
          const setsUsuario = Array.isArray(data['setsGanados']) ? (data['setsGanados'][idx] ?? 0) : 0;
          const setsOponente = Array.isArray(data['setsGanados']) ? (data['setsGanados'][oponenteIdx] ?? 0) : 0;
          const ganado = data['ganadorUid'] === userId;
          this.historialPartidos.push({
            oponente: oponente ? `${oponente.nombre}` : 'Desconocido',
            setsUsuario,
            setsOponente,
            fecha: data['creadoEn']?.toDate ? data['creadoEn'].toDate() : data['creadoEn'] || '',
            ganado
          });
        }
      }
    });
    console.log('Historial generado:', this.historialPartidos);
  }

  async cargarRankingPersonal() {
    // 1. Obtén todos los usuarios
    const usersRef = collection(this.firestore, 'users');
    const usersSnap = await getDocs(usersRef);

    // 2. Crea un mapa de usuarios
    const jugadoresMap = new Map<string, any>();
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      jugadoresMap.set(docSnap.id, {
        uid: docSnap.id,
        nombre: data['nombre'],
        apellido: data['apellido'],
        partidosGanados: 0,
        partidosJugados: 0
      });
    });

    // 3. Recorre todos los partidos y cuenta jugados/ganados
    const partidosRef = collection(this.firestore, 'partidos');
    const partidosSnap = await getDocs(partidosRef);

    partidosSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const jugadores = data['jugadores'] || [];
      const ganadorUid = data['ganadorUid'];

      jugadores.forEach((jugador: any) => {
        const jugadorData = jugadoresMap.get(jugador.uid);
        if (jugadorData) {
          jugadorData.partidosJugados += 1;
          if (ganadorUid === jugador.uid) {
            jugadorData.partidosGanados += 1;
          }
        }
      });
    });

    // 4. Convierte el mapa a array y ordena
    this.ranking = Array.from(jugadoresMap.values())
      .sort((a, b) => b.partidosGanados - a.partidosGanados);

    // 5. Busca la posición del usuario actual
    const miUid = this.jugador.uid;
    const index = this.ranking.findIndex(j => j.uid === miUid);
    this.posicionRanking = index !== -1 ? index + 1 : null;
  }

  async guardarPaleta() {
    const userId = this.jugador.uid;
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, {
      gomaDerecha: this.jugador.gomaDerecha || '',
      gomaReves: this.jugador.gomaReves || '',
      madero: this.jugador.madero || ''
    });
  }
}
