// models/user.model.ts
export interface User {
  uid?: string;
  nombre: string;
  apellido: string;
  email: string;
  tipoUsuario: string;
}
