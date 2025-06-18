import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinTournamentPage } from './join-tournament.page';

describe('JoinTournamentPage', () => {
  let component: JoinTournamentPage;
  let fixture: ComponentFixture<JoinTournamentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(JoinTournamentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
