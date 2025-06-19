export interface Torneo {
  uid: string;
  nombre: string;
  estado: 'esperando' | 'en_juego' | 'finalizado';
  tipo: 'grupos';
  jugadores: Jugador[];
  grupos?: Grupo[];
  partidos: Partido[];
  ganador?: Jugador;
  creadoPor: Jugador;
  creadoEn: Date;
  arbitros?: Jugador[];
  faseActual?: string; // Fase actual del torneo (ej: "fase de grupos", "cuartos", "semifinal", "final")
  fecha?: Date; // Fecha del torneo
}

export interface Jugador {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface Partido {
  id: string;
  fase: string;
  grupo?: string;
  jugadores: Jugador[];
  arbitro?: Jugador | null;
  estado: string;
  ganador?: Jugador | null;
  codigo?: string;
  setsGanados?: [number, number]; // <-- Añadido para mostrar los sets (ej: [3,1])
  // Puedes agregar más campos si lo necesitas (ej: fecha, etc.)
}

export interface Grupo {
  nombre: string; // Ej: "Grupo A"
  jugadores: Jugador[];
  resultados?: { [uid: string]: number };
}
