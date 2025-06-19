import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

interface RankingJugador {
  nombre: string;
  apellido: string;
  partidosGanados: number;
  partidosJugados: number;
  uid: string;
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: false
})
export class RankingPage implements OnInit {
  ranking: RankingJugador[] = [];

  constructor(private firestore: Firestore) {}

  async ngOnInit() {
    await this.cargarRanking();
  }

  async cargarRanking() {
    // 1. Obtén todos los usuarios
    const usersRef = collection(this.firestore, 'users');
    const usersSnap = await getDocs(usersRef);

    // 2. Crea un mapa de usuarios
    const jugadoresMap = new Map<string, RankingJugador>();
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
  }
}
