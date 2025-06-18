import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TorneoResumenPage } from './torneo-resumen.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: TorneoResumenPage }])
  ],
  declarations: [TorneoResumenPage]
})
export class TorneoResumenPageModule {}
