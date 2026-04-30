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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ItemModel } from '../../models/item-model';
import { ItemService } from '../../../services/item.service';
import {
  containsSuspiciousPattern,
  sanitizeSearchTerm,
  sanitizeText
} from '../../core/security/input-sanitizer';
import { validateImageFile } from '../../core/security/file-validator';


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
    MatButtonToggleModule,
  ],
  templateUrl: './boxes.component.html',
  styleUrl: './boxes.component.scss',
})
export class BoxesComponent implements OnInit {
  boxes: BoxModel[] = [];
  items: ItemModel[] = [];
  loading = false;
  showAddForm = false;

  newBox: BoxModel = {
    id: '',
    name: '',
    description: '',
    imgUrl: '',
  };

  selectedImageFile: File | null = null;
  imagePreviewUrl: string = '';
  private searchTimeout: any;
  currentPage = 1;
  pageSize = 10;
  searchName: string = '';
  totalRecords = 0;

  tipoSelecionado: 'caixa' | 'item' = 'caixa';

  constructor(
    private boxService: BoxService,
    private router: Router,
    private snackBar: MatSnackBar,
    private itemService: ItemService
  ) {}

  ngOnInit() {
    this.loadBoxes();
  }

  loadBoxes() {
    this.loading = true;
    this.boxService
      .getBoxes(this.currentPage, this.pageSize)
      .then((result) => {
        this.boxes = result.items;
        this.totalRecords = result.totalRecords;
        this.loading = false;
      })
      .catch((error) => {
        console.error('Erro ao buscar caixas', error);
        this.loading = false;
      });
  }

  async createBox() {
    const name = sanitizeText(this.newBox.name, { maxLength: 100 });
    const description = sanitizeText(this.newBox.description, { maxLength: 1000, multiline: true });

    if (!name) {
      this.showToast('O nome da caixa é obrigatório', 'error');
      return;
    }
    if (containsSuspiciousPattern(name) || containsSuspiciousPattern(description)) {
      this.showToast('Conteúdo inválido detectado nos campos.', 'error');
      return;
    }

    if (this.selectedImageFile) {
      const result = await validateImageFile(this.selectedImageFile);
      if (!result.ok) {
        this.showToast(result.error ?? 'Imagem inválida.', 'error');
        return;
      }
    }

    this.newBox.name = name;
    this.newBox.description = description;

    try {
      await this.boxService.createBox(this.newBox, this.selectedImageFile ?? undefined);
      this.showAddForm = false;
      this.resetForm();
      this.loadBoxes();
    } catch (error) {
      console.error('Erro ao criar caixa', error);
      this.showToast('Erro ao criar caixa', 'error');
    }
  }

  async handleBoxImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const result = await validateImageFile(file);
    if (!result.ok) {
      input.value = '';
      this.selectedImageFile = null;
      this.imagePreviewUrl = '';
      this.showToast(result.error ?? 'Imagem inválida.', 'error');
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.imagePreviewUrl = String(e.target?.result ?? '');
    };
    reader.readAsDataURL(file);
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
    event.target.src = 'assets/default-box-image.jpeg';
  }

  onSearchChange(name: string): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      const sanitized = sanitizeSearchTerm(name);
      this.searchName = sanitized;

      if (!sanitized) {
        this.items = [];
        this.tipoSelecionado === 'caixa' ? this.loadBoxes() : (this.items = []);
        return;
      }

      if (this.tipoSelecionado === 'caixa') {
        this.searchBoxByName(sanitized);
      } else {
        this.searchItemByName(sanitized);
      }
    }, 400);
  }

  searchBoxByName(name: string): void {
    const sanitized = sanitizeSearchTerm(name);
    if (!sanitized) {
      this.showToast('Por favor, digite um nome válido para buscar');
      return;
    }
    this.loading = true;
    this.boxService
      .getBoxByName(sanitized)
      .then((boxes) => {
        this.boxes = boxes;
        this.loading = false;
      })
      .catch((err) => {
        console.error('Erro ao buscar caixa por nome', err);
        this.boxes = [];
        this.loading = false;
      });
  }

  searchItemByName(name: string): void {
  const sanitized = sanitizeSearchTerm(name);
  if (!sanitized) {
    this.showToast('Por favor, digite um nome válido para buscar');
    return;
  }
  this.loading = true;
  this.itemService
    .getItemByName(sanitized) // ✅ Agora está correto
    .then((items) => {
      this.items = items;
      this.loading = false;
    })
    .catch((err) => {
      console.error('Erro ao buscar item por nome', err);
      this.items = [];
      this.loading = false;
    });
}

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'warning'): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`${type}-toast`],
    });
  }

  clearSearch(): void {
    this.searchName = '';
    this.items = [];
    if (this.tipoSelecionado === 'caixa') {
      this.loadBoxes();
    }
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
