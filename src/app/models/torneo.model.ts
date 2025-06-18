export interface Torneo {
  id?: string;
  nombre: string;
  estado: 'esperando' | 'en_juego' | 'finalizado';
  tipo: 'grupos' | 'eliminacion_directa'; // nuevo campo
  jugadores: Jugador[];
  grupos?: Grupo[]; // nuevo
  partidos: Partido[];
  ganador?: Jugador;
  creadoPor: Jugador;
  creadoEn: Date;
}

export interface Jugador {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface Partido {
  id: string;
  fase: 'grupo' | 'octavos' | 'cuartos' | 'semifinal1' | 'semifinal2' | 'final';
  jugadores: Jugador[];
  arbitro?: Jugador;
  puntajes?: number[];
  estado: 'pendiente' | 'en_juego' | 'finalizado';
}

export interface Grupo {
  nombre: string; // Ej: "Grupo A"
  jugadores: Jugador[];
  resultados?: { [uid: string]: number }; // puntajes por jugador
}
