import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoraComponent } from './lora.component';

describe('LoraComponent', () => {
  let component: LoraComponent;
  let fixture: ComponentFixture<LoraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
