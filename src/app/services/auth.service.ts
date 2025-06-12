import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  login(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(this.auth, email, password);
}

  async register(userData: User, password: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email, password);
    const uid = userCredential.user.uid;

    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      uid,
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      tipoUsuario: userData.tipoUsuario,
      fotoURL: '' // <-- Aquí agregas el campo
    });
  }

  async getCurrentUserData() {
  const user = this.auth.currentUser;
  if (!user) return null;
  const userDoc = await getDoc(doc(this.firestore, `users/${user.uid}`));
  return userDoc.exists() ? userDoc.data() : null;
}

  logout(): Promise<void> {
    return this.auth.signOut();
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }
}
