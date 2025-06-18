import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, DocumentData } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Partido, Jugador } from '../../models/torneo.model';

@Component({
  selector: 'app-torneo-grupos',
  templateUrl: './torneo-grupos.page.html',
  styleUrls: ['./torneo-grupos.page.scss'],
  standalone: false
})
export class TorneoGruposPage implements OnInit, OnDestroy {
  torneoId: string = '';
  grupos: string[] = [];
  partidosPorGrupo: { [grupo: string]: Partido[] } = {};
  unsubscribe: any;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.torneoId = this.route.parent?.snapshot.paramMap.get('codigo') || '';
    this.cargarPartidosGruposTiempoReal();
  }

  cargarPartidosGruposTiempoReal() {
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId), where('fase', '==', 'grupo'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const partidos: Partido[] = snapshot.docs.map(d => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          grupo: data['grupo'],
          jugadores: data['jugadores'],
          setsGanados: data['setsGanados'],
          ganador: data['ganador'] ?? null
        } as Partido;
      });

      // Agrupar partidos por grupo
      const gruposSet = new Set(partidos.map(p => p.grupo));
this.grupos = Array.from(gruposSet).filter((g): g is string => typeof g === 'string').sort();
      this.partidosPorGrupo = {};
      for (const grupo of this.grupos) {
        this.partidosPorGrupo[grupo] = partidos.filter(p => p.grupo === grupo);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  // Devuelve el resultado en sets (ej: "3-1") o "esperando resultado"
  getResultadoSets(partido: Partido): string {
    if (Array.isArray(partido.setsGanados) && partido.setsGanados.length === 2) {
      if (typeof partido.setsGanados[0] === 'number' && typeof partido.setsGanados[1] === 'number') {
        if (partido.setsGanados[0] === 0 && partido.setsGanados[1] === 0) {
          return 'Esperando resultado';
        }
        return `${partido.setsGanados[0]} - ${partido.setsGanados[1]}`;
      }
    }
    return 'Esperando resultado';
  }
}
