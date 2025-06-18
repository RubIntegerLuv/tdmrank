import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TorneoPage } from './torneo.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: TorneoPage,
        children: [
      { path: '', redirectTo: 'torneo-mis-partidos', pathMatch: 'full' },
      { path: 'torneo-mis-partidos', loadChildren: () => import('src/app/pages/torneo-mis-partidos/torneo-mis-partidos.module').then(m => m.TorneoMisPartidosPageModule) },
      { path: 'torneo-grupos', loadChildren: () => import('src/app/pages/torneo-grupos/torneo-grupos.module').then(m => m.TorneoGruposPageModule) },
      { path: 'torneo-resumen', loadChildren: () => import('src/app/pages/torneo-resumen/torneo-resumen.module').then(m => m.TorneoResumenPageModule) }
    ]
      }
    ])
  ],
  declarations: [TorneoPage]
})
export class TorneoPageModule {}
