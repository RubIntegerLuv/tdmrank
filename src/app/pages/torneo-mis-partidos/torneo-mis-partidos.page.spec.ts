import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TorneoMisPartidosPage } from './torneo-mis-partidos.page';

describe('TorneoMisPartidosPage', () => {
  let component: TorneoMisPartidosPage;
  let fixture: ComponentFixture<TorneoMisPartidosPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TorneoMisPartidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
