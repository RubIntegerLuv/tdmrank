import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { IonicModule } from '@ionic/angular';

import { JoinTournamentPage } from './join-tournament.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: JoinTournamentPage }]),
    SharedModule
  ],
  declarations: [JoinTournamentPage]
})
export class JoinTournamentPageModule {}
