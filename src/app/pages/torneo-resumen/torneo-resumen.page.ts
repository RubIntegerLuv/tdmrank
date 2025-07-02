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
    if (!this.torneoId) return;
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

  /** Crea partidos de una fase y actualiza la fase del torneo */
  async crearPartidosFase(
    fase: string,
    emparejamientos: any[][],
    arbitros: any[]
  ) {
    let arbitroIndex = 0;
    const partidosIds: string[] = []; // Lista para almacenar los IDs de los partidos

  for (const pareja of emparejamientos) {
    const partidoRef = await addDoc(collection(this.firestore, 'partidos'), {
      torneoId: this.torneoId,
      jugadores: pareja,
      arbitro: arbitros.length > 0 ? arbitros[arbitroIndex++ % arbitros.length] : null,
      estado: 'esperando',
      setsGanados: [0, 0],
      puntosActuales: [0, 0],
      lado: [0, 1],
      ganador: null,
      creadoEn: new Date(),
      fase
    });

      partidosIds.push(partidoRef.id); // Agregar el ID del partido a la lista
    }

    // Actualiza el documento del torneo con los IDs de los partidos
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    await updateDoc(torneoDoc, {
      estado: 'en_juego',
      faseActual: fase,
      [`partidos.${fase}`]: partidosIds // Guardar los IDs de los partidos por fase
    });
  }

  async crearSiguienteFase() {
    const arbitros = this.torneo?.arbitros || [];
    console.log('Arbitros disponibles:', arbitros);

    // 1. Obtener todos los grupos y sus partidos
    const grupos = this.grupos;
    console.log('Grupos detectados:', grupos);

    const partidosGrupo = this.partidos.filter(p => p.fase === 'grupo');
    console.log('Partidos de grupo:', partidosGrupo);

    // 2. Para cada grupo, calcular la tabla de posiciones
    const clasificadosPorGrupo: { primero: any, segundo: any }[] = [];
    for (const grupo of grupos) {
      const partidosDelGrupo = partidosGrupo.filter(p => p.grupo === grupo);
      console.log(`Partidos del grupo ${grupo}:`, partidosDelGrupo);

      const jugadoresGrupo: { [uid: string]: { jugador: any, sets: number, partidosGanados: number } } = {};

      partidosDelGrupo.forEach(p => {
        p.jugadores.forEach(j => {
          if (!jugadoresGrupo[j.uid]) {
            jugadoresGrupo[j.uid] = { jugador: j, sets: 0, partidosGanados: 0 };
          }
        });
      });

      partidosDelGrupo.forEach(p => {
        if (p.setsGanados && Array.isArray(p.setsGanados) && p.setsGanados.length === 2) {
          jugadoresGrupo[p.jugadores[0].uid].sets += p.setsGanados[0];
          jugadoresGrupo[p.jugadores[1].uid].sets += p.setsGanados[1];
          if (p.ganador && p.ganador.uid) {
            jugadoresGrupo[p.ganador.uid].partidosGanados += 1;
          }
        }
      });

      const ordenados = Object.values(jugadoresGrupo).sort((a, b) => {
        if (b.sets !== a.sets) return b.sets - a.sets;
        return b.partidosGanados - a.partidosGanados;
      });

      console.log(`Jugadores ordenados en el grupo ${grupo}:`, ordenados);

      if (ordenados.length >= 2) {
        clasificadosPorGrupo.push({
          primero: ordenados[0].jugador,
          segundo: ordenados[1].jugador
        });
      }
    }

    console.log('Clasificados por grupo:', clasificadosPorGrupo);

    // 3. Emparejar cruzado
    const emparejamientos: any[][] = [];
    let nuevaFase = '';
    if (clasificadosPorGrupo.length === 2) {
      emparejamientos.push([clasificadosPorGrupo[0].primero, clasificadosPorGrupo[1].segundo]);
      emparejamientos.push([clasificadosPorGrupo[1].primero, clasificadosPorGrupo[0].segundo]);
      nuevaFase = 'semifinal';
    } else if (clasificadosPorGrupo.length > 2) {
      for (let i = 0; i < clasificadosPorGrupo.length; i++) {
        const siguiente = (i + 1) % clasificadosPorGrupo.length;
        emparejamientos.push([clasificadosPorGrupo[i].primero, clasificadosPorGrupo[siguiente].segundo]);
      }
      nuevaFase = emparejamientos.length === 4 ? 'cuartos' : (emparejamientos.length === 2 ? 'semifinal' : 'final');
    } else {
      console.error('No hay suficientes clasificados para crear la siguiente fase.');
      return;
    }

    console.log('Emparejamientos para la nueva fase:', emparejamientos);
    console.log('Nueva fase:', nuevaFase);

    // 4. Crear partidos de la siguiente fase si no existen
    const yaExisten = this.partidos.some(p => p.fase === nuevaFase);
    console.log(`¿Ya existen partidos de la fase ${nuevaFase}?:`, yaExisten);

    if (!yaExisten) {
      await this.crearPartidosFase(nuevaFase, emparejamientos, arbitros);
      console.log(`Partidos de la fase ${nuevaFase} creados con éxito.`);
      return;
    }

    // 5. Si ya hay semifinales y están finalizadas, crea la final (solo si no existe)
    if (nuevaFase === 'semifinal') {
      const semis = this.partidos.filter(p => p.fase === 'semifinal');
      console.log('Partidos de semifinal:', semis);

      const semisFinalizadas = semis.length === 2 && semis.every(p => p.estado === 'finalizado' && p.ganador);
      console.log('¿Semifinales finalizadas?:', semisFinalizadas);

      const yaHayFinal = this.partidos.some(p => p.fase === 'final');
      console.log('¿Ya existe la final?:', yaHayFinal);

      if (semisFinalizadas && !yaHayFinal) {
        const ganadoresSemis = semis
          .map(p => p.ganador)
          .filter((g): g is Jugador => g !== null && g !== undefined && typeof g.uid === 'string')
          .reduce((acc: Jugador[], ganador) => {
            if (!acc.some(g => g.uid === ganador.uid)) {
              acc.push(ganador);
            }
            return acc;
          }, []);

        console.log('Ganadores únicos de semifinales:', ganadoresSemis);

        if (ganadoresSemis.length === 2) {
          await this.crearPartidosFase('final', [ganadoresSemis], arbitros);
          console.log('Final creada con éxito.');
        } else {
          console.error('No se encontraron dos ganadores únicos en las semifinales.');
        }
      } else {
        console.error('No se puede crear la final: semifinales no finalizadas o ya existe la final.');
      }
      return;
    }
  }

  async finalizarTorneo() {
    if (!this.torneoId || !this.torneo) return;

    // Buscar el partido de la final que esté finalizado
    const finalPartido = this.partidos.find(p => p.fase === 'final' && p.estado === 'finalizado');
    if (!finalPartido || !finalPartido.ganador) {
      console.error('No se puede finalizar el torneo porque no hay un ganador definido en la final.');
      return;
    }

    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    try {
      await updateDoc(torneoDoc, {
        estado: 'finalizado',
        finalizadoEn: new Date(),
        ganador: finalPartido.ganador // Guardar directamente el ganador del partido de la final
      });
      console.log('Torneo finalizado correctamente, ganador:', finalPartido.ganador);
    } catch (error) {
      console.error('Error al finalizar el torneo:', error);
    }
  }
}

