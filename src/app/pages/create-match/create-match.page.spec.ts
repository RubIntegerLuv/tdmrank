import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateMatchPage } from './create-match.page';

describe('CreateMatchPage', () => {
  let component: CreateMatchPage;
  let fixture: ComponentFixture<CreateMatchPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CreateMatchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
