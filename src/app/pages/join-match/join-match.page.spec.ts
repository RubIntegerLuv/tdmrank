import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JoinMatchPage } from './join-match.page';

describe('JoinMatchPage', () => {
  let component: JoinMatchPage;
  let fixture: ComponentFixture<JoinMatchPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(JoinMatchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
