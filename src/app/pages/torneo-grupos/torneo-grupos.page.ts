import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, DocumentData } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Partido } from '../../models/torneo.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

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
  user: User | null = null;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUserData() as User | null;

    // Obtención robusta del UID del torneo
    let uid = this.route.snapshot.paramMap.get('uid');
    if (!uid && this.route.parent) {
      uid = this.route.parent.snapshot.paramMap.get('uid');
    }
    if (!uid && this.route.parent?.parent) {
      uid = this.route.parent.parent.snapshot.paramMap.get('uid');
    }
    this.torneoId = uid || '';

    this.cargarPartidosGruposTiempoReal();
  }

  cargarPartidosGruposTiempoReal() {
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const todosLosPartidos: Partido[] = snapshot.docs.map(d => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          grupo: data['grupo'],
          jugadores: data['jugadores'],
          setsGanados: data['setsGanados'],
          ganador: data['ganador'] ?? null,
          fase: data['fase']
        } as Partido;
      });

      // Filtra solo los de fase grupo
      const partidos = todosLosPartidos.filter(p => p.fase === 'grupo');

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
