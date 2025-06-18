import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TorneoResumenPage } from './torneo-resumen.page';

describe('TorneoResumenPage', () => {
  let component: TorneoResumenPage;
  let fixture: ComponentFixture<TorneoResumenPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TorneoResumenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
