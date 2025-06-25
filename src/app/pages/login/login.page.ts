import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.loginForm.invalid) {
      this.presentToast('Por favor, completa todos los campos correctamente.');
      return;
    }
    const { email, password } = this.loginForm.value;
    const loading = await this.loadingCtrl.create({
      message: 'Ingresando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.login(email, password);
      await loading.dismiss();
      this.router.navigate(['/home']);
    } catch (err: any) {
      await loading.dismiss();
      console.error('Login error', err);

      let message = 'Error desconocido. Intenta nuevamente.';
       if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        message = 'Correo o contraseña inválidos.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde.';
      } else if (err.message?.includes('INVALID_LOGIN_CREDENTIALS')) {
        message = 'Correo o contraseña inválidos.';
      }
      this.presentToast(message);
    }
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

  RegisterPage() {
    this.router.navigate(['/register']);
  }

  ionViewWillEnter() {
    this.loginForm.reset();
  }
}
