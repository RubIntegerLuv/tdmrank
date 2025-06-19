import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../models/user.model';

interface Partido {
  id: string;
  torneoId: string;
  grupo?: string;
  jugadores: User[];
  arbitro?: User | null;
  estado: string;
  ganador?: User | null;
  fase: string;
}

@Component({
  selector: 'app-torneo-mis-partidos',
  templateUrl: './torneo-mis-partidos.page.html',
  styleUrls: ['./torneo-mis-partidos.page.scss'],
  standalone: false
})
export class TorneoMisPartidosPage implements OnInit, OnDestroy {
  partidos: Partido[] = [];
  user: User | null = null;
  torneoId: string = '';
  unsubscribe: any;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = await this.authService.getCurrentUserData() as User | null;
    if (!this.user) return;

    // Obtención robusta del UID del torneo
    let uid = this.route.snapshot.paramMap.get('uid');
    if (!uid && this.route.parent) {
      uid = this.route.parent.snapshot.paramMap.get('uid');
    }
    if (!uid && this.route.parent?.parent) {
      uid = this.route.parent.parent.snapshot.paramMap.get('uid');
    }
    this.torneoId = uid || '';

    this.cargarPartidosTiempoReal();
  }

  cargarPartidosTiempoReal() {
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.partidos = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Partido))
        .filter(p =>
          (p.jugadores.some(j => j.uid === this.user!.uid)) ||
          (p.arbitro && p.arbitro.uid === this.user!.uid)
        );
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  }

  esJugador(partido: Partido): boolean {
    return !!partido.jugadores.some(j => j.uid === this.user?.uid);
  }

  esArbitro(partido: Partido): boolean {
    return !!(partido.arbitro && this.user && this.user.tipoUsuario === 'arbitro' && partido.arbitro.uid === this.user.uid);
  }

  irASala(partido: Partido) {
    if (this.esArbitro(partido)) {
      const partidoDoc = doc(this.firestore, 'partidos', partido.id);
      updateDoc(partidoDoc, { estado: 'en_juego' });
    }
    this.router.navigate(['/partido', partido.id]);
  }
}
