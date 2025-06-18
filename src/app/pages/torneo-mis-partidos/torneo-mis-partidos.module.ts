import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { TorneoMisPartidosPage } from './torneo-mis-partidos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      { path: '', component: TorneoMisPartidosPage }
    ])
  ],
  declarations: [TorneoMisPartidosPage]
})
export class TorneoMisPartidosPageModule {}
