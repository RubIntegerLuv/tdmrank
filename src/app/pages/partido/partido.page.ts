import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-partido',
  templateUrl: './partido.page.html',
  styleUrls: ['./partido.page.scss'],
  standalone: false
})
export class PartidoPage implements OnInit {
  partidoId: string = '';
  partido: any;
  jugadores: any[] = [];
  arbitro: any;
  setsGanados: number[] = [0, 0];
  puntosActuales: number[] = [0, 0];
  lado: number[] = [0, 1];
  cantidadSets: number = 3;
  ganador: string | null = null;
  esArbitro: boolean = false;
  emptySets: any[][] = [[], []];
  historial: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.partidoId = this.route.snapshot.paramMap.get('id')!;
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    onSnapshot(partidoDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data) {
        this.partido = data;
        this.jugadores = data['jugadores'];
        this.arbitro = data['arbitro'];
        this.setsGanados = data['setsGanados'];
        this.puntosActuales = data['puntosActuales'];
        this.lado = data['lado'];
        this.cantidadSets = data['cantidadSets'];
        this.ganador = data['ganador'];
        this.emptySets = [
          Array(Math.max(0, Math.floor(this.cantidadSets / 2 + 1 - this.setsGanados[0]))),
          Array(Math.max(0, Math.floor(this.cantidadSets / 2 + 1 - this.setsGanados[1])))
        ];
        this.historial = data['historial'] || [];

        const user = await this.authService.getCurrentUserData();
        this.esArbitro = user?.["uid"] === this.arbitro?.uid;
      }
    });
  }

  async sumarPunto(jugador: number) {
    if (!this.esArbitro || this.ganador) return;
    const puntos = [...this.puntosActuales];
    puntos[jugador]++;
    await this.actualizarPuntos(puntos, { accion: 'sumar', jugador, puntos: [...this.puntosActuales] });
  }

  async restarPunto(jugador: number) {
    if (!this.esArbitro || this.ganador) return;
    const puntos = [...this.puntosActuales];
    if (puntos[jugador] > 0) puntos[jugador]--;
    await this.actualizarPuntos(puntos, { accion: 'restar', jugador, puntos: [...this.puntosActuales] });
  }

  async deshacerUltimoPunto() {
    if (!this.esArbitro || this.ganador || this.historial.length === 0) return;
    const ultimo = this.historial[this.historial.length - 1];
    const puntos = [...ultimo.puntos];
    await this.actualizarPuntos(puntos, null, true);
  }

  async actualizarPuntos(puntos: number[], accion: any = null, esDeshacer = false) {
    let setsGanados = [...this.setsGanados];
    let lado = [...this.lado];
    let ganador: string | null = null;
    let historial = [...this.historial];

    const maxPuntos = 11;
    const setGanador = puntos.findIndex(
      (p, i) => p >= maxPuntos && p - puntos[1 - i] >= 2
    );
    const setDecisivo = (setsGanados[0] + setsGanados[1] + 1) === this.cantidadSets;
    const mitadSet = Math.floor(maxPuntos / 2);

    // Cambio de lado en set decisivo al llegar a 5 puntos
    if (setDecisivo && (puntos[0] === mitadSet || puntos[1] === mitadSet)) {
      lado = [lado[1], lado[0]];
    }

    // Si alguien ganó el set
    if (setGanador !== -1) {
      setsGanados[setGanador]++;
      puntos = [0, 0];
      lado = [lado[1], lado[0]];
    }

    // ¿Alguien ganó el partido?
    const setsParaGanar = Math.floor(this.cantidadSets / 2) + 1;
    if (setsGanados[0] === setsParaGanar) ganador = this.jugadores[lado[0]].nombre;
    if (setsGanados[1] === setsParaGanar) ganador = this.jugadores[lado[1]].nombre;

    // Historial para deshacer
    if (!esDeshacer && accion) {
      historial.push(accion);
    }
    if (esDeshacer) {
      historial.pop();
    }

    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    await updateDoc(partidoDoc, {
      puntosActuales: puntos,
      setsGanados: setsGanados,
      lado: lado,
      ganador: ganador,
      historial: historial
    });
  }
}
