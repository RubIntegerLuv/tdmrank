import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TorneoGruposPage } from './torneo-grupos.page';

describe('TorneoGruposPage', () => {
  let component: TorneoGruposPage;
  let fixture: ComponentFixture<TorneoGruposPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TorneoGruposPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
