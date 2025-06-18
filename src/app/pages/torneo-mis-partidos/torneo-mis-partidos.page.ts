import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

interface Jugador {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
}
interface Partido {
  id: string;
  torneoId: string;
  grupo?: string;
  jugadores: Jugador[];
  arbitro?: Jugador | null;
  estado: string;
  ganador?: Jugador | null;
  fase: string;
  // ...otros campos
}

@Component({
  selector: 'app-torneo-mis-partidos',
  templateUrl: './torneo-mis-partidos.page.html',
  styleUrls: ['./torneo-mis-partidos.page.scss'],
  standalone: false
})
export class TorneoMisPartidosPage implements OnInit {
  partidos: Partido[] = [];
  user: Jugador | null = null;
  torneoId: string = '';

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUserData() as Jugador | null;
    if (!this.user) return;
    this.torneoId = this.route.parent?.snapshot.paramMap.get('codigo') || '';
    await this.cargarPartidos();
  }

  async cargarPartidos() {
    if (!this.user || !this.torneoId) return;
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId));
    const querySnap = await getDocs(q);
    this.partidos = querySnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Partido))
      .filter(p =>
        (p.jugadores.some(j => j.uid === this.user!.uid)) ||
        (p.arbitro && p.arbitro.uid === this.user!.uid)
      );
  }

  esJugador(partido: Partido): boolean {
    return !!partido.jugadores.some(j => j.uid === this.user?.uid);
  }

  esArbitro(partido: Partido): boolean {
    return !!(partido.arbitro && partido.arbitro.uid === this.user?.uid);
  }

  irASala(partido: Partido) {
    this.router.navigate(['/partido', partido.id]);
  }

  async asignarseComoArbitro(partido: Partido) {
    if (!this.user) return;
    await updateDoc(doc(this.firestore, 'partidos', partido.id), {
      arbitro: this.user
    });
    await this.cargarPartidos();
  }
}
