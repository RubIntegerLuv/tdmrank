import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

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
    private router: Router
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      tipoUsuario: ['', Validators.required]
    });
  }

  registrar() {
    if (this.registerForm.invalid) return;

    const { nombre, apellido, email, password, tipoUsuario } = this.registerForm.value;

    this.authService
      .register({ nombre, apellido, email, tipoUsuario }, password)
      .then(() => {
        console.log('Usuario registrado');
        this.router.navigate(['/login']);
      })
      .catch(err => console.error('Error en registro:', err));
  }
}
