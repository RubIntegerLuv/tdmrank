import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';
import { Firestore, collection, addDoc, doc, updateDoc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { inject } from '@angular/core';

interface Jugador {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
  tipoUsuario?: string;
}
interface Grupo {
  nombre: string;
  jugadores: Jugador[];
}

@Component({
  selector: 'app-create-tourtnament',
  templateUrl: './create-tourtnament.page.html',
  styleUrls: ['./create-tourtnament.page.scss'],
  standalone: false
})
export class CreateTourtnamentPage implements OnInit, OnDestroy {
  usuario: any;
  nombreTorneo: string = '';
  fechaTorneo: string = '';
  creando: boolean = false;
  torneoCreado: boolean = false;
  codigoTorneo: string = '';
  torneoId: string = '';
  jugadores: Jugador[] = [];
  arbitros: Jugador[] = [];
  esperando: boolean = false;
  private firestore = inject(Firestore);
  private unsubscribeTorneo: any;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  async ngOnInit() {
    this.usuario = await this.authService.getCurrentUserData();
  }

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
        uid: admin?.['uid'],
        nombre: admin?.['nombre'],
        apellido: admin?.['apellido'],
        email: admin?.['email']
      },
      creadoEn: new Date(),
      fecha: this.fechaTorneo,
      formato: 'grupos',
      gruposCreados: false
    };

    const docRef = await addDoc(torneosRef, nuevoTorneo);
    this.torneoId = docRef.id;
    await updateDoc(docRef, { uid: this.torneoId });

    this.torneoCreado = true;
    this.creando = false;
    this.esperando = true;
    this.escucharInscritos();
  }

  escucharInscritos() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    this.unsubscribeTorneo = onSnapshot(torneoDoc, (snap) => {
      const data = snap.data();
      this.jugadores = data?.['jugadores'] || [];
      this.arbitros = data?.['arbitros'] || [];
      this.esperando = !(this.jugadores.length >= 4 && this.arbitros.length >= 1);
    });
  }

  async iniciarTorneo() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    const snap = await getDoc(torneoDoc);
    const data = snap.data();
    if (data?.['gruposCreados']) {
      this.router.navigate(['/torneo', this.torneoId]);
      return;
    }
    const jugadores = data?.['jugadores'] || [];
    const arbitros = data?.['arbitros'] || [];
    await this.crearGruposYPartidos(this.torneoId, jugadores, arbitros, this.firestore);
    this.router.navigate(['/torneo', this.torneoId]);
  }

  async crearGruposYPartidos(torneoId: string, jugadores: Jugador[], arbitros: Jugador[], firestore: Firestore) {
    const shuffled = jugadores
      .map(j => ({ sort: Math.random(), value: j }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value);

    let grupos: Grupo[] = [];
    let partidos: any[] = [];

    // Algoritmo para crear grupos
    if (shuffled.length === 4) {
      grupos = [
        { nombre: 'Grupo A', jugadores: [shuffled[0], shuffled[1]] },
        { nombre: 'Grupo B', jugadores: [shuffled[2], shuffled[3]] }
      ];
    } else {
      const n = shuffled.length;
      let numGrupos = Math.floor(n / 3);
      let resto = n % 3;
      let index = 0;
      for (let i = 0; i < numGrupos; i++) {
        let tam = 3;
        if (resto > 0) {
          tam = 4;
          resto--;
        }
        const grupoJugadores = shuffled.slice(index, index + tam);
        grupos.push({ nombre: `Grupo ${String.fromCharCode(65 + i)}`, jugadores: grupoJugadores });
        index += tam;
      }
    }

    // Asignación equitativa de árbitros a partidos (round robin)
    let arbitroIndex = 0;
    for (const grupo of grupos) {
      for (let i = 0; i < grupo.jugadores.length; i++) {
        for (let j = i + 1; j < grupo.jugadores.length; j++) {
          const codigo = this.generarCodigo();
          const arbitroAsignado = arbitros.length > 0 ? arbitros[arbitroIndex % arbitros.length] : null;
          arbitroIndex++;

          const partidoRef = await addDoc(collection(firestore, 'partidos'), {
            codigo,
            torneoId,
            grupo: grupo.nombre,
            jugadores: [grupo.jugadores[i], grupo.jugadores[j]],
            estado: 'esperando',
            setsGanados: [0, 0],
            puntosActuales: [0, 0],
            lado: [0, 1],
            ganador: null,
            arbitro: arbitroAsignado,
            creadoEn: new Date(),
            fase: 'grupo'
          });
          partidos.push({
            id: partidoRef.id,
            codigo,
            grupo: grupo.nombre,
            fase: 'grupo'
          });
        }
      }
    }

    await updateDoc(doc(firestore, 'torneos', torneoId), {
      grupos,
      partidos,
      estado: 'en_juego',
      gruposCreados: true
    });
  }

  copiarCodigo() {
    navigator.clipboard.writeText(this.codigoTorneo);
  }
  ngOnDestroy() {
    if (this.unsubscribeTorneo) {
      this.unsubscribeTorneo();
    }
  }
}
