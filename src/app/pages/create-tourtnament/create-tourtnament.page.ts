import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';
import { Firestore, collection, addDoc, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { inject } from '@angular/core';

@Component({
  selector: 'app-create-tourtnament',
  templateUrl: './create-tourtnament.page.html',
  styleUrls: ['./create-tourtnament.page.scss'],
  standalone: false
})
export class CreateTourtnamentPage implements OnInit {
  nombreTorneo: string = '';
  fechaTorneo: string = '';
  creando: boolean = false;
  torneoCreado: boolean = false;
  codigoTorneo: string = '';
  torneoId: string = '';
  jugadores: any[] = [];
  arbitros: any[] = [];
  esperando: boolean = false;

  private firestore = inject(Firestore);

  constructor(
    private router: Router,
    private authService: AuthService,
    private menuCtrl: MenuController
  ) {}

  ngOnInit() {}

  generarCodigo(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async crearTorneo() {
    if (!this.nombreTorneo) {
      alert('Debes ingresar el nombre del torneo');
      return;
    }
    this.creando = true;
    const admin = await this.authService.getCurrentUserData();
    this.codigoTorneo = this.generarCodigo();
    const torneosRef = collection(this.firestore, 'torneos');

    const nuevoTorneo = {
      nombre: this.nombreTorneo,
      codigo: this.codigoTorneo,
      estado: 'esperando',
      jugadores: [],
      arbitros: [],
      partidos: [],
      creadoPor: {
        uid: admin?.["uid"],
        nombre: admin?.["nombre"],
        apellido: admin?.["apellido"],
        email: admin?.["email"]
      },
      creadoEn: new Date(),
      fecha: this.fechaTorneo,
      formato: 'grupos'
    };

    const docRef = await addDoc(torneosRef, nuevoTorneo);
    this.torneoId = docRef.id;
    this.torneoCreado = true;
    this.creando = false;
    this.esperando = true;

    // Escuchar en tiempo real los jugadores y árbitros inscritos
    this.escucharInscritos();
  }

  async escucharInscritos() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    // Puedes usar onSnapshot si quieres tiempo real, aquí solo ejemplo con getDoc
    setInterval(async () => {
      const snap = await getDoc(torneoDoc);
      const data = snap.data();
      this.jugadores = data?.["jugadores"] || [];
      this.arbitros = data?.["arbitros"] || [];
      // Si hay 4 jugadores y al menos 1 árbitro, permitir iniciar
      if (this.jugadores.length === 4 && this.arbitros.length >= 1) {
        this.esperando = false;
      } else {
        this.esperando = true;
      }
    }, 2000);
  }

  async iniciarTorneo() {
    // Aquí luego se crearán los grupos y partidos según la lógica que definamos en la siguiente parte
    this.router.navigate(['/torneo', this.codigoTorneo]);
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
