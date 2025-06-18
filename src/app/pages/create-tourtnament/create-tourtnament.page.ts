import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuController } from '@ionic/angular';
import { Firestore, collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { onSnapshot } from '@angular/fire/firestore';

// Tipos para robustez
interface Jugador {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
}
interface Grupo {
  nombre: string;
  jugadores: Jugador[];
}
interface Partido {
  grupo: string;
  ganador?: Jugador | null;
  jugadores: Jugador[];
  // ...otros campos si los necesitas
}

@Component({
  selector: 'app-create-tourtnament',
  templateUrl: './create-tourtnament.page.html',
  styleUrls: ['./create-tourtnament.page.scss'],
  standalone: false
})
export class CreateTourtnamentPage implements OnInit, OnDestroy {
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
      // Espera a al menos 4 jugadores y al menos 1 árbitro
      this.esperando = !(this.jugadores.length >= 4 && this.arbitros.length >= 1);
    });
  }

  async iniciarTorneo() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    const snap = await getDoc(torneoDoc);
    const data = snap.data();
    if (data?.['gruposCreados']) {
      this.router.navigate(['/torneo', this.codigoTorneo]);
      return;
    }
    const jugadores = data?.['jugadores'] || [];
    await this.crearGruposYPartidos(this.torneoId, jugadores, this.firestore);
    this.router.navigate(['/torneo', this.codigoTorneo]);
  }

  async crearGruposYPartidos(torneoId: string, jugadores: Jugador[], firestore: Firestore) {
    // Mezclar jugadores al azar
    const shuffled = jugadores
      .map(j => ({ sort: Math.random(), value: j }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value);

    let grupos: Grupo[] = [];
    let partidos: any[] = [];

    if (shuffled.length === 4) {
      // 2 grupos de 2
      grupos = [
        { nombre: 'Grupo A', jugadores: [shuffled[0], shuffled[1]] },
        { nombre: 'Grupo B', jugadores: [shuffled[2], shuffled[3]] }
      ];
      // Un partido por grupo
      for (const grupo of grupos) {
        const codigo = this.generarCodigo();
        const partidoRef = await addDoc(collection(firestore, 'partidos'), {
          codigo,
          torneoId,
          grupo: grupo.nombre,
          jugadores: grupo.jugadores,
          estado: 'esperando',
          setsGanados: [0, 0],
          puntosActuales: [0, 0],
          lado: [0, 1],
          ganador: null,
          arbitro: null,
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
      // Semifinales y final se crean después
    } else {
      // Grupos de 3 o 4 según cantidad de jugadores
      const n = shuffled.length;
      let numGrupos = Math.floor(n / 3);
      let resto = n % 3;

      // Si hay resto, algunos grupos serán de 4
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

      // Crear partidos de todos contra todos en cada grupo
      for (const grupo of grupos) {
        for (let i = 0; i < grupo.jugadores.length; i++) {
          for (let j = i + 1; j < grupo.jugadores.length; j++) {
            const codigo = this.generarCodigo();
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
              arbitro: null,
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
    }

    // Actualiza el torneo con los grupos y partidos creados
    await updateDoc(doc(firestore, 'torneos', torneoId), {
      grupos,
      partidos,
      estado: 'en_juego',
      gruposCreados: true
    });
  }

  // Función centralizada para avanzar de fase (llaves)
  async avanzarFaseEliminacionDirecta() {
    const torneoDoc = doc(this.firestore, 'torneos', this.torneoId);
    const torneoSnap = await getDoc(torneoDoc);
    const torneoData = torneoSnap.data();
      if (!torneoData) {
        throw new Error('No se encontró el torneo');
      }
    const grupos: Grupo[] = torneoData?.['grupos'] || [];

    // Obtener partidos de grupo
    const partidosRef = collection(this.firestore, 'partidos');
    const q = query(partidosRef, where('torneoId', '==', this.torneoId), where('fase', '==', 'grupo'));
    const partidosSnap = await getDocs(q);
    const partidosGrupo: Partido[] = partidosSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        grupo: data['grupo'],
        jugadores: data['jugadores'],
        ganador: data['ganador'] ?? null
        // ...otros campos si los necesitas
      } as Partido;
    });

    // Verificar que todos los partidos de grupo terminaron
    if (partidosGrupo.some((p: Partido) => !p.ganador)) {
      throw new Error('Aún hay partidos de grupo sin terminar');
    }

    // Clasificar los 2 mejores de cada grupo
    let clasificados: Jugador[] = [];
    for (const grupo of grupos) {
      const jugadores = grupo.jugadores;
      const victorias = jugadores.map(j => ({
        jugador: j,
        victorias: partidosGrupo.filter(
          (p: Partido) => p.grupo === grupo.nombre && p.ganador && p.ganador.uid === j.uid
        ).length
      }));
      victorias.sort((a, b) => b.victorias - a.victorias);
      clasificados.push(...victorias.slice(0, 2).map(v => v.jugador));
    }

    // Generar el bracket (llave) de eliminación directa
    const numClasificados = clasificados.length;
    if (numClasificados < 2) throw new Error('No hay suficientes clasificados');

    // Emparejar: 1° de grupo i vs 2° de grupo i+1 (circular)
    let emparejamientos: Jugador[][] = [];
    for (let i = 0; i < grupos.length; i++) {
      const primero = clasificados[i * 2];
      const segundo = clasificados[((i + 1) % grupos.length) * 2 + 1];
      emparejamientos.push([primero, segundo]);
    }

    // Determinar fase
    let fase = '';
    if (numClasificados === 4) fase = 'semifinal';
    else if (numClasificados === 8) fase = 'cuartos';
    else if (numClasificados === 16) fase = 'octavos';
    else if (numClasificados === 32) fase = 'dieciseisavos';
    else if (numClasificados === 64) fase = 'treintaidosavos';
    else if (numClasificados === 128) fase = 'sesentaicuatroavos';
    else fase = 'eliminacion';

    // Crear partidos de la siguiente fase
    let nuevosPartidos: any[] = [];
    for (const match of emparejamientos) {
      const codigo = this.generarCodigo();
      const partidoRef = await addDoc(partidosRef, {
        codigo,
        torneoId: this.torneoId,
        fase,
        jugadores: match,
        estado: 'esperando',
        setsGanados: [0, 0],
        puntosActuales: [0, 0],
        lado: [0, 1],
        ganador: null,
        arbitro: null,
        creadoEn: new Date()
      });
      nuevosPartidos.push({
        id: partidoRef.id,
        codigo,
        fase
      });
    }

    // Actualizar el torneo con los nuevos partidos y estado
    await updateDoc(torneoDoc, {
      partidos: [
        ...(torneoData?.['partidos'] || []),
        ...nuevosPartidos
      ],
      estado: fase
    });
  }

  copiarCodigo() {
    navigator.clipboard.writeText(this.codigoTorneo);
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

  ngOnDestroy() {
    if (this.unsubscribeTorneo) {
      this.unsubscribeTorneo();
    }
  }
}
