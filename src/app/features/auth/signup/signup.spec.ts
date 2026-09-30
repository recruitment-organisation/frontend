import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Signup } from './signup';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SharedModule } from '../../../shared/shared-module';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Signup], imports: [ReactiveFormsModule, RouterModule.forRoot([]), SharedModule], providers: [provideHttpClient()], schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
