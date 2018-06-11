import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendtodolistComponent } from './friendtodolist.component';

describe('FriendtodolistComponent', () => {
  let component: FriendtodolistComponent;
  let fixture: ComponentFixture<FriendtodolistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FriendtodolistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FriendtodolistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
