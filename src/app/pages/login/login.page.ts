import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  login() {
    // Agrega tu lógica de login aquí
    console.log('Botón de login presionado');
  }
}
