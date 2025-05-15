import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
  }

  register() {
    console.log('Botón de register presionado');
    this.router.navigate(['/login']);  // Cambia '/login' por la ruta real si es diferente
  }

}
