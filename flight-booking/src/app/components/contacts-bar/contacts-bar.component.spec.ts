import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsBarComponent } from './contacts-bar.component';

describe('ContactsBarComponent', () => {
  let component: ContactsBarComponent;
  let fixture: ComponentFixture<ContactsBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
