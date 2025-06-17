import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TorneoPage } from './pages/torneo/torneo.page';

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
    path: 'torneo/:codigo',
    loadChildren: () => import('./pages/torneo/torneo.module').then(m => m.TorneoPageModule)
  },  {
    path: 'ranking',
    loadChildren: () => import('./pages/ranking/ranking.module').then( m => m.RankingPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
