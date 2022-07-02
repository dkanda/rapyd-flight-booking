import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutBarComponent } from './about-bar.component';

describe('AboutBarComponent', () => {
  let component: AboutBarComponent;
  let fixture: ComponentFixture<AboutBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
