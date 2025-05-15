import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';


import { CreateTourtnamentPage } from './create-tourtnament.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: CreateTourtnamentPage
      }
    ])
  ],
  declarations: [CreateTourtnamentPage]
})
export class CreateTourtnamentPageModule {}
