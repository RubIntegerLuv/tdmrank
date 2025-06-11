import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PartidoPage } from './partido.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { NumberToArrayPipe } from 'src/app/pipes/number-to-array.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: PartidoPage }]),
    SharedModule,
    NumberToArrayPipe
  ],
  declarations: [PartidoPage]
})
export class PartidoPageModule {}
