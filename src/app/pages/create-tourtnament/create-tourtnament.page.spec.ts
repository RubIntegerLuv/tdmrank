import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateTourtnamentPage } from './create-tourtnament.page';

describe('CreateTourtnamentPage', () => {
  let component: CreateTourtnamentPage;
  let fixture: ComponentFixture<CreateTourtnamentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CreateTourtnamentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
