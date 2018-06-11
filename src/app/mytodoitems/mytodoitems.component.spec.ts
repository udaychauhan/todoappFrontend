import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MytodoitemsComponent } from './mytodoitems.component';

describe('MytodoitemsComponent', () => {
  let component: MytodoitemsComponent;
  let fixture: ComponentFixture<MytodoitemsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MytodoitemsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MytodoitemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
