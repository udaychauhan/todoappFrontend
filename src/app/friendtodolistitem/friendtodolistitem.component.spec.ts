import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendtodolistitemComponent } from './friendtodolistitem.component';

describe('FriendtodolistitemComponent', () => {
  let component: FriendtodolistitemComponent;
  let fixture: ComponentFixture<FriendtodolistitemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FriendtodolistitemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FriendtodolistitemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
