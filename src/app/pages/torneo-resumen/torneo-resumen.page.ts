import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, DocumentData } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Partido, Jugador } from '../../models/torneo.model';

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

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.torneoId = this.route.parent?.snapshot.paramMap.get('codigo') || '';
    this.cargarPartidosTiempoReal();
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
          codigo: data['codigo']
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

  // Orden lógico de fases
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
}
