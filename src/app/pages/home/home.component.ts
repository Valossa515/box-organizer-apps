import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BoxesComponent } from '../boxes/boxes.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BoxesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {}
