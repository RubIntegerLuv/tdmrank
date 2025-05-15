import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
  }

  login() {
    console.log('Botón de login presionado');
    this.router.navigate(['/home']);  // Cambia '/login' por la ruta real si es diferente
  }
  RegisterPage(){
    console.log('Botón de register presionado');
    this.router.navigate(['register']);
  }
}
