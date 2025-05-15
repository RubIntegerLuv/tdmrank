import { CreateTourtnamentPage } from './../create-tourtnament/create-tourtnament.page';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
  }

  logout() {
    this.router.navigate(['/login']);
  }
  createTourtnament() {
    this.router.navigate(['/create-tourtnament']);
  }
}
