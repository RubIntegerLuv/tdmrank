import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-tourtnament',
  templateUrl: './create-tourtnament.page.html',
  styleUrls: ['./create-tourtnament.page.scss'],
  standalone: false
})
export class CreateTourtnamentPage implements OnInit {

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
