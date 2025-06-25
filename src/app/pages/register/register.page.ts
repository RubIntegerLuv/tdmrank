import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,30}$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(namePattern)]],
      apellido: ['', [Validators.required, Validators.pattern(namePattern)]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        ]],
      password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
      tipoUsuario: ['', Validators.required]
    });
  }

  async registrar() {
    if (this.registerForm.invalid) return;

    const loading = await this.loadingCtrl.create({
      message: 'Registrando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    const { nombre, apellido, email, password, tipoUsuario } = this.registerForm.value;

    this.authService.register({ nombre, apellido, email, tipoUsuario }, password)
      .then(async () => {
        await loading.dismiss();
        this.presentToast('Usuario registrado exitosamente.');
        this.router.navigate(['/login']);
      })
      .catch(async (err) => {
        await loading.dismiss();
        console.error('Error en registro:', err);
        this.presentToast('Error al registrar usuario. Intenta nuevamente.');
      });
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

  get f() {
    return this.registerForm.controls;
  }
}
