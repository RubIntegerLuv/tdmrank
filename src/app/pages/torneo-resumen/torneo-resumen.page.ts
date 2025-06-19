import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, DocumentData, doc, getDoc, addDoc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Partido, Jugador, Torneo } from '../../models/torneo.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-torneo-resumen',
  templateUrl: './torneo-resumen.page.html',
  styleUrls: ['./torneo-resumen.page.scss'],
  standalone: false
})
export class TorneoResumenPage implements OnInit, OnDestroy {
  torneoId: string = '';
  partidos: Partido[] = [];
  fases: string[] = [];
  grupos: string[] = [];
  unsubscribe: any;
  user: Jugador | null = null;
  torneo: Torneo | null = null;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Obtención robusta del UID del torneo
    let uid = this.route.snapshot.paramMap.get('uid');
    if (!uid && this.route.parent) {
      uid = this.route.parent.snapshot.paramMap.get('uid');
    }
    if (!uid && this.route.parent?.parent) {
      uid = this.route.parent.parent.snapshot.paramMap.get('uid');
    }
    this.torneoId = uid || '';

    this.user = await this.authService.getCurrentUserData() as Jugador | null;
    await this.cargarTorneo();
    this.cargarPartidosTiempoReal();
  }

  async cargarTorneo() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    const snap = await getDoc(torneoDoc);
    this.torneo = snap.data() as Torneo;
  }

  cargarPartidosTiempoReal() {
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.partidos = snapshot.docs.map(d => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          fase: data['fase'],
          grupo: data['grupo'],
          jugadores: data['jugadores'],
          arbitro: data['arbitro'],
          estado: data['estado'],
          ganador: data['ganador'],
          codigo: data['codigo'],
          setsGanados: data['setsGanados']
        } as Partido;
      });

      // Detectar fases únicas presentes (excepto grupos)
      this.fases = Array.from(
        new Set(this.partidos
          .filter(p => p.fase !== 'grupo')
          .map(p => p.fase))
      ).sort(this.ordenarFases);

      // Detectar grupos únicos presentes
      this.grupos = Array.from(
        new Set(this.partidos
          .filter(p => p.fase === 'grupo' && p.grupo)
          .map(p => p.grupo!))
      ).sort();
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  ordenarFases(a: string, b: string): number {
    const orden = [
      'final',
      'semifinal',
      'cuartos',
      'octavos',
      'dieciseisavos',
      'treintaidosavos',
      'sesentaicuatroavos'
    ];
    const ia = orden.indexOf(a);
    const ib = orden.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  }

  getPartidosPorFase(fase: string): Partido[] {
    return this.partidos.filter(p => p.fase === fase);
  }

  getPartidosPorGrupo(grupo: string): Partido[] {
    return this.partidos.filter(p => p.fase === 'grupo' && p.grupo === grupo);
  }

  // --- NUEVO: Lógica para avanzar de fase ---

  get esAdmin(): boolean {
    return !!(this.user && this.torneo && this.torneo.creadoPor && this.torneo.creadoPor.uid === this.user.uid);
  }

  get gruposFinalizados(): boolean {
    // Todos los partidos de grupo deben estar en estado 'finalizado'
    return this.partidos
      .filter(p => p.fase === 'grupo')
      .every(p => p.estado === 'finalizado');
  }

  get siguienteFaseDisponible(): boolean {
    // Solo muestra el botón si no hay partidos de la siguiente fase
    const haySemis = this.partidos.some(p => p.fase === 'semifinal');
    const hayFinal = this.partidos.some(p => p.fase === 'final');
    if (this.gruposFinalizados && !haySemis && !hayFinal) return true;
    if (this.gruposFinalizados && haySemis && !hayFinal) {
      // Si ya hay semis pero no final, permite crear la final
      const semisFinalizadas = this.partidos.filter(p => p.fase === 'semifinal').every(p => p.estado === 'finalizado');
      return semisFinalizadas;
    }
    return false;
  }

  async crearSiguienteFase() {
    // Detectar si toca semifinal o final
    const haySemis = this.partidos.some(p => p.fase === 'semifinal');
    const arbitros = this.torneo?.arbitros || [];
    let arbitroIndex = 0;

    if (!haySemis) {
      // Crear semifinales con los ganadores de grupo
      const ganadoresGrupo = this.partidos
        .filter(p => p.fase === 'grupo' && p.ganador)
        .map(p => p.ganador)
       .filter((g, i, arr) => g && arr.findIndex(x => x && x.uid === g.uid) === i); // únicos

      if (ganadoresGrupo.length < 4) return; // Solo crea semis si hay 4 ganadores

      // Emparejamiento simple: 1vs2 y 3vs4
      const emparejamientos = [
        [ganadoresGrupo[0], ganadoresGrupo[1]],
        [ganadoresGrupo[2], ganadoresGrupo[3]]
      ];

      for (const pareja of emparejamientos) {
        await addDoc(collection(this.firestore, 'partidos'), {
          torneoId: this.torneoId,
          jugadores: pareja,
          arbitro: arbitros.length > 0 ? arbitros[arbitroIndex % arbitros.length] : null,
          estado: 'esperando',
          setsGanados: [0, 0],
          puntosActuales: [0, 0],
          lado: [0, 1],
          ganador: null,
          creadoEn: new Date(),
          fase: 'semifinal'
        });
        arbitroIndex++;
      }
    } else {
      // Crear final con los ganadores de las semis
      const ganadoresSemis = this.partidos
        .filter(p => p.fase === 'semifinal' && p.ganador)
        .map(p => p.ganador)
        .filter((g, i, arr) => g && arr.findIndex(x => x && x.uid === g.uid) === i); // únicos

      if (ganadoresSemis.length < 2) return;

      await addDoc(collection(this.firestore, 'partidos'), {
        torneoId: this.torneoId,
        jugadores: [ganadoresSemis[0], ganadoresSemis[1]],
        arbitro: arbitros.length > 0 ? arbitros[arbitroIndex % arbitros.length] : null,
        estado: 'esperando',
        setsGanados: [0, 0],
        puntosActuales: [0, 0],
        lado: [0, 1],
        ganador: null,
        creadoEn: new Date(),
        fase: 'final'
      });
    }

    // Opcional: actualiza el estado del torneo
    await updateDoc(doc(this.firestore, 'torneos', this.torneoId), {
      estado: 'en_juego'
    });
  }
}
