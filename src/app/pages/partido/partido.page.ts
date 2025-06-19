import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';

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
  cantidadSets: number = 5;
  ganador: string | null = null;
  esArbitro: boolean = false;
  emptySets: any[][] = [[], []];
  historial: any[] = [];

  private cambioLadoDecisivoRealizado: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.partidoId = this.route.snapshot.paramMap.get('id')!;
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);

    onSnapshot(partidoDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data) {
        this.partido = data;
        this.jugadores = data['jugadores'] || [];
        this.arbitro = data['arbitro'] || null;
        this.setsGanados = Array.isArray(data['setsGanados']) ? data['setsGanados'] : [0, 0];
        this.puntosActuales = Array.isArray(data['puntosActuales']) ? data['puntosActuales'] : [0, 0];
        this.lado = Array.isArray(data['lado']) ? data['lado'] : [0, 1];
        this.cantidadSets = typeof data['cantidadSets'] === 'number' ? data['cantidadSets'] : 3;
        this.ganador = data['ganador'] || null;
        this.historial = data['historial'] || [];

        const setsParaGanar = Math.floor(this.cantidadSets / 2) + 1;
        this.emptySets = [
          Array(Math.max(0, setsParaGanar - this.setsGanados[0])),
          Array(Math.max(0, setsParaGanar - this.setsGanados[1]))
        ];

        const user = await this.authService.getCurrentUserData();

        const rolTemporal = sessionStorage.getItem('rolTemporal');
        const esEspectador = !!rolTemporal;

        this.esArbitro = !esEspectador &&
          user &&
          this.arbitro &&
          user["uid"] === this.arbitro["uid"] &&
          user["tipoUsuario"] === "arbitro";
      }
    });
  }

  salirComoEspectador() {
    sessionStorage.removeItem('rolTemporal'); // Restauramos el estado original
    this.router.navigate(['/home']);
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
    let ganadorUid: string | null = null;
    let historial = [...this.historial];

    const maxPuntos = 11;
    const setGanador = puntos.findIndex(
      (p, i) => p >= maxPuntos && p - puntos[1 - i] >= 2
    );
    const setDecisivo = (setsGanados[0] + setsGanados[1] + 1) === this.cantidadSets;
    const mitadSet = Math.floor(maxPuntos / 2);

    // Reinicia el flag al cambiar de set (excepto en deshacer)
    if (!esDeshacer && setGanador !== -1) {
      this.cambioLadoDecisivoRealizado = false;
    }

    // Cambio de lado en set decisivo al llegar a 5 puntos (solo una vez)
    if (
      setDecisivo &&
      !this.cambioLadoDecisivoRealizado &&
      (puntos[0] === mitadSet || puntos[1] === mitadSet)
    ) {
      lado = [lado[1], lado[0]];
      puntos = [puntos[1], puntos[0]];
      this.cambioLadoDecisivoRealizado = true;
    }

    // Si alguien ganó el set
    if (setGanador !== -1) {
      setsGanados[setGanador]++;
      puntos = [0, 0];
      lado = [lado[1], lado[0]];
      // Intercambiar setsGanados para que coincidan con el nuevo lado
      setsGanados = [setsGanados[1], setsGanados[0]];
    }

    // ¿Alguien ganó el partido?
    const setsParaGanar = Math.floor(this.cantidadSets / 2) + 1;
    if (setsGanados[0] === setsParaGanar) {
      ganador = this.jugadores[lado[0]];
      ganadorUid = this.jugadores[lado[0]].uid;
    }
    if (setsGanados[1] === setsParaGanar) {
      ganador = this.jugadores[lado[1]];
      ganadorUid = this.jugadores[lado[1]].uid;
    }

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
      ganadorUid: ganadorUid,
      historial: historial
    });
  }

  async finalizarPartido() {
    if (!this.ganador) return; // Solo permite finalizar si hay ganador
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    await updateDoc(partidoDoc, { estado: 'finalizado' });

    // Si el partido tiene torneoId, navega al resumen del torneo, si no, al home
    if (this.partido && this.partido.torneoId) {
      this.router.navigate(['/torneo', this.partido.torneoId, 'resumen']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
