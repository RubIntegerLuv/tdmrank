import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';
import { collection, getDocs, Firestore, onSnapshot, query, where, orderBy } from '@angular/fire/firestore';
import { LoadingController, ToastController } from '@ionic/angular';


interface RankingJugador {
  nombre: string;
  apellido: string;
  partidosGanados: number;
  partidosJugados: number;
  uid: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})

export class HomePage implements OnInit {
  usuario: any;
  rankingJugadores: any[] = [];
  top5Ranking: any[] = [];
  ranking: any[] = [];
  partidosEnVivo: any[] = [];
  torneos : any[] = [];


  constructor(private router: Router,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private firestore: Firestore,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUserData();
    await this.menuCtrl.enable(true, 'main-menu');
    await this.cargarRankingJugadores();
    this.top5Ranking = this.rankingJugadores.slice(0, 5);
    this.escucharPartidosEnVivo();
    this.escucharTorneos();
  }

  escucharPartidosEnVivo() {
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('estado', '==', 'en_juego'));

    onSnapshot(q, (snapshot) => {
      this.partidosEnVivo = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  escucharTorneos() {
    const torneosRef = collection(this.firestore, 'torneos');
    // Escucha torneos en juego o finalizados, ordenados por fecha de creación descendente
    const q = query(torneosRef, where('estado', 'in', ['en_juego', 'finalizado']), orderBy('creadoEn', 'desc'));
    onSnapshot(q, (snapshot) => {
      this.torneos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  verPartidoComoEspectador(partidoId: string) {
    sessionStorage.setItem('rolTemporal', this.usuario.tipoUsuario); // Guardamos el rol original
    this.router.navigate(['/partido', partidoId]);
  }

  verResumenTorneo(torneoId: string) {
    sessionStorage.setItem('rolTemporal', this.usuario.tipoUsuario);
    sessionStorage.setItem('modoEspectador', 'true');
    this.router.navigate(['/torneo', torneoId, 'resumen']);
  }

  verTorneoEnVivo(torneoId: string) {
    sessionStorage.setItem('rolTemporal', this.usuario.tipoUsuario);
    sessionStorage.setItem('modoEspectador', 'true');
    this.router.navigate(['/torneo', torneoId, 'resumen']);
  }



  async logout() {
    try {
      await this.authService.logout();
      await this.menuCtrl.close('main-menu');
      this.router.navigate(['/login']);
      this.presentToast('Sesión cerrada correctamente.');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }
  async createTourtnament() {
    await this.menuCtrl.close();
    this.router.navigate(['/create-tourtnament']);
  }
  async createMatch() {
    await this.menuCtrl.close();
    this.router.navigate(['/create-match']);
  }
  joinMatch() {
    this.router.navigate(['/join-match']);
  }
  goToPerfil() {
    this.router.navigate(['/perfil']);
  }
  joinTournament() {
    this.router.navigate(['/join-tournament']);
  }
  goToRanking() {
    this.router.navigate(['/ranking']);
  }

  async cargarRankingJugadores() {
    // 1. Obtén todos los usuarios
    const usersRef = collection(this.firestore, 'users');
    const usersSnap = await getDocs(usersRef);

    // 2. Crea un mapa de usuarios
    const jugadoresMap = new Map<string, RankingJugador>();
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      jugadoresMap.set(docSnap.id, {
        uid: docSnap.id,
        nombre: data['nombre'],
        apellido: data['apellido'],
        partidosGanados: 0,
        partidosJugados: 0
      });
    });

    // 3. Recorre todos los partidos y cuenta jugados/ganados
    const partidosRef = collection(this.firestore, 'partidos');
    const partidosSnap = await getDocs(partidosRef);

    partidosSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const jugadores = data['jugadores'] || [];
      const ganadorUid = data['ganadorUid'];

      jugadores.forEach((jugador: any) => {
        const jugadorData = jugadoresMap.get(jugador.uid);
        if (jugadorData) {
          jugadorData.partidosJugados += 1;
          if (ganadorUid === jugador.uid) {
            jugadorData.partidosGanados += 1;
          }
        }
      });
    });

    // 4. Convierte el mapa a array y ordena
    this.ranking = Array.from(jugadoresMap.values())
      .sort((a, b) => b.partidosGanados - a.partidosGanados);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
