import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TorneoPage } from './pages/torneo/torneo.page';
import { TorneoPageModule } from './pages/torneo/torneo.module';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'create-tourtnament',
    loadChildren: () => import('./pages/create-tourtnament/create-tourtnament.module').then( m => m.CreateTourtnamentPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'create-match',
    loadChildren: () => import('./pages/create-match/create-match.module').then( m => m.CreateMatchPageModule)
  },
  {
    path: 'join-match',
    loadChildren: () => import('./pages/join-match/join-match.module').then( m => m.JoinMatchPageModule)
  },
  {
    path: 'partido/:id',
    loadChildren: () => import('./pages/partido/partido.module').then( m => m.PartidoPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then(m => m.PerfilPageModule)
  },
  {
    path: 'join-tournament',
    loadChildren: () => import('./pages/join-tournament/join-tournament.module').then( m => m.JoinTournamentPageModule)
  },

    {
      path: 'torneo/:uid',
      component: TorneoPage,
      children: [
        {
          path: 'mis-partidos',
          loadChildren: () =>
            import('./pages/torneo-mis-partidos/torneo-mis-partidos.module').then(m => m.TorneoMisPartidosPageModule),
        },
        {
          path: 'grupos',
          loadChildren: () =>
            import('./pages/torneo-grupos/torneo-grupos.module').then(m => m.TorneoGruposPageModule),
        },
        {
          path: 'resumen',
          loadChildren: () =>
            import('./pages/torneo-resumen/torneo-resumen.module').then(m => m.TorneoResumenPageModule),
        },
        {
          path: '',
          redirectTo: 'mis-partidos',
          pathMatch: 'full'
        }
      ]
    },
  {
    path: 'ranking',
    loadChildren: () => import('./pages/ranking/ranking.module').then( m => m.RankingPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    TorneoPageModule // Import the TorneoPageModule here
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
