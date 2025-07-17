import { BoxService } from '../../../services/box.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BoxModel } from '../../models/box-model';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-boxes',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    HttpClientModule,
    MatIconModule,
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './boxes.component.html',
  styleUrl: './boxes.component.scss'
})
export class BoxesComponent implements OnInit {
  boxes: BoxModel[] = [];
  loading = false;
  showAddForm = false;

  newBox: BoxModel = {
    id: '',
    name: '',
    description: '',
    imgUrl: ''
  };

  selectedImageFile: File | null = null;
  imagePreviewUrl: string = '';
  private searchTimeout: any;
  currentPage = 1;
  pageSize = 10;
  searchName: string = '';
  totalRecords = 0;

  constructor(private boxService: BoxService, private router: Router, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.loadBoxes();
  }

  loadBoxes() {
    this.loading = true;
    this.boxService.getBoxes(this.currentPage, this.pageSize)
      .then((result) => {
        this.boxes = result.data;
        this.totalRecords = result.totalRecords; // <- ESSENCIAL
        this.loading = false;
        console.log('Caixas carregadas com sucesso', this.boxes);
      })
      .catch((error) => {
        console.error('Erro ao buscar caixas', error);
        this.loading = false;
      });
  }

  createBox() {
    this.boxService.createBox(this.newBox, this.selectedImageFile ?? undefined)
      .then(() => {
        this.showAddForm = false;
        this.resetForm();
        this.loadBoxes();
      })
      .catch(error => {
        console.error('Erro ao criar caixa', error);
      });
  }

  handleBoxImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = '';
  }

  resetForm(): void {
    this.newBox = { id: '', name: '', description: '', imgUrl: '' };
    this.selectedImageFile = null;
    this.imagePreviewUrl = '';
  }

  goToItems(boxId: string) {
    this.router.navigate(['/items', boxId]);
  }

  handleImgError(event: any): void {
    event.target.src = 'assets/default-box-image.jpeg'; // Fallback image
  }

  onSearchChange(name: string): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      if (!name.trim()) {
        this.loadBoxes();
        return;
      }

      this.searchByName(name);
    }, 400);
  }

  searchByName(name: string): void {

    if (!name || !name.trim()) {
      this.showToast('Por favor, digite um nome para buscar');
      return;
    }
    this.loading = true;

    this.boxService.getBoxByName(name)
      .then(items => {
        this.boxes = items;
        this.loading = false;
      })
      .catch(err => {
        console.error('Erro ao buscar item por nome', err);
        this.boxes = [];
        this.loading = false;
      });
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'warning'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`${type}-toast`]
    });
  }

  clearSearch(): void {
    this.searchName = '';
    this.loadBoxes();
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadBoxes();
  }
}