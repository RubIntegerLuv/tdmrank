import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Firestore, collection, addDoc, doc, updateDoc, onSnapshot, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-create-match',
  templateUrl: './create-match.page.html',
  styleUrls: ['./create-match.page.scss'],
  standalone: false
})
export class CreateMatchPage implements OnInit {

  tipoPartido: 'individual' | 'dobles' = 'individual';
  cantidadSets: number = 5;
  codigoPartido: string = '';
  jugadores: any[] = [];
  partidoId: string = '';
  arbitro: any;
  partidoYaExiste: boolean = false;

  private firestore = inject(Firestore);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private menuCtrl: MenuController
  ) {}

  async ngOnInit() {
    this.arbitro = await this.authService.getCurrentUserData();

    // Verifica si viene un código por query param
    this.route.queryParams.subscribe(async params => {
      if (params['codigo']) {
        this.codigoPartido = params['codigo'];
        // Busca el partido por código
        const partidosRef = collection(this.firestore, 'partidos');
        const q = query(partidosRef, where('codigo', '==', this.codigoPartido));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const partidoDocSnap = querySnap.docs[0];
          this.partidoId = partidoDocSnap.id;
          const data = partidoDocSnap.data();
          this.jugadores = data['jugadores'] || [];
          this.tipoPartido = data['tipo'] || 'individual';
          this.cantidadSets = data['cantidadSets'] || 5;
          this.partidoYaExiste = true;

          // Escucha en tiempo real los jugadores conectados
          const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
          onSnapshot(partidoDoc, (snapshot) => {
            const data = snapshot.data();
            this.jugadores = data ? data['jugadores'] || [] : [];
          });
        }
      }
    });
  }

  async crearPartido() {
    this.arbitro = await this.authService.getCurrentUserData();
    this.codigoPartido = this.generarCodigo();
    const partidosRef = collection(this.firestore, 'partidos');
    const partidoRef = await addDoc(partidosRef, {
      codigo: this.codigoPartido,
      estado: 'esperando',
      arbitro: {
        uid: this.arbitro.uid,
        nombre: `${this.arbitro.nombre} ${this.arbitro.apellido}`
      },
      jugadores: [],
      creadoEn: new Date(),
      tipo: this.tipoPartido,
      cantidadSets: this.cantidadSets,
      setsGanados: [0, 0],
      puntosActuales: [0, 0],
      lado: [0, 1],
      ganador: null
    });
    this.partidoId = partidoRef.id;
    this.partidoYaExiste = true;

    // Escucha en tiempo real los jugadores conectados
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    onSnapshot(partidoDoc, (snapshot) => {
      const data = snapshot.data();
      this.jugadores = data ? data['jugadores'] || [] : [];
    });
  }

  generarCodigo(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async expulsarJugador(uid: string) {
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    const jugadoresFiltrados = this.jugadores.filter(j => j.uid !== uid);
    await updateDoc(partidoDoc, { jugadores: jugadoresFiltrados });
  }

  async iniciarPartido() {
    const partidoDoc = doc(this.firestore, `partidos/${this.partidoId}`);
    await updateDoc(partidoDoc, { estado: 'en_juego' });
    this.router.navigate(['/partido', this.partidoId]);
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.menuCtrl.close('main-menu');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
