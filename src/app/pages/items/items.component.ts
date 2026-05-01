import { ItemModel } from './../../models/item-model';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { ItemService } from '../../../services/item.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BoxService } from '../../../services/box.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import {
  containsSuspiciousPattern,
  sanitizeSearchTerm,
  sanitizeText
} from '../../core/security/input-sanitizer';
import { validateImageFile } from '../../core/security/file-validator';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ItemsComponent implements OnInit {
  items: ItemModel[] = [];
  loading = false;
  totalRecords = 0;
  boxId!: string;
  showAddForm = false;
  newItem: ItemModel = {
    id: '',
    name: '',
    description: '',
    quantity: 1,
    boxId: this.boxId,
    boxName: '',
    imgUrl: ''
  };

  editingItemId: string | null = null;
  editItemModel: ItemModel = { id: '', name: '', description: '', quantity: 0, boxId: '', boxName: '', imgUrl: '' };
  selectedAddImage: File | null = null;
  selectedEditImage: File | null = null;
  boxName = '';
  searchName: string = '';
  currentPage = 1;
  pageSize = 10;
  private searchTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private itemService: ItemService,
    private router: Router,
    private boxService: BoxService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.boxId = this.route.snapshot.params['boxId'];
    this.fetchBoxName().then(() => this.fetchItems());
  }

  fetchBoxName(): Promise<void> {
    return this.boxService.getBoxById(this.boxId)
      .then(box => {
        if (box) {
          this.boxName = box.name;
        }
      })
      .catch(err => {
        console.error('Erro ao buscar nome da caixa', err);
      });
  }

  fetchItems(): void {
    this.loading = true;
    this.itemService.getItems(this.boxId, this.currentPage, this.pageSize)
      .then(result => {
        this.items = result.items;
        this.items.forEach(item => item.boxName = this.boxName);
        this.totalRecords = result.totalRecords;
        this.loading = false;
      })
      .catch(err => {
        console.error('Erro ao buscar itens', err);
        this.loading = false;
      });
  }

  async createItem(): Promise<void> {
    // Saneamento + validação defensiva contra XSS/injeção.
    const name = sanitizeText(this.newItem.name, { maxLength: 100 });
    const description = sanitizeText(this.newItem.description, { maxLength: 1000, multiline: true });

    if (!name) {
      this.showToast('O nome do item é obrigatório', 'error');
      return;
    }
    if (containsSuspiciousPattern(name) || containsSuspiciousPattern(description)) {
      this.showToast('Conteúdo inválido detectado nos campos.', 'error');
      return;
    }

    const quantity = Number(this.newItem.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
      this.showToast('A quantidade deve ser um número entre 1 e 1.000.000', 'error');
      return;
    }

    this.newItem.name = name;
    this.newItem.description = description;
    this.newItem.boxId = this.boxId;
    this.newItem.quantity = quantity;

    if (this.selectedAddImage) {
      const result = await validateImageFile(this.selectedAddImage);
      if (!result.ok) {
        this.showToast(result.error ?? 'Imagem inválida.', 'error');
        return;
      }
    }

    try {
      const item = await this.itemService.createItem(this.newItem, this.selectedAddImage ?? undefined);
      item.boxName = this.boxName;
      this.items.push(item);
      this.totalRecords++;
      this.showAddForm = false;
      this.resetForm();
      this.selectedAddImage = null;
      this.showToast('Item criado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar item', err);
      this.showToast('Erro ao criar item', 'error');
    }
  }

  startEdit(item: ItemModel): void {
    this.editingItemId = item.id;
    this.editItemModel = {
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      boxId: item.boxId,
      boxName: item.boxName,
      imgUrl: item.imgUrl || ''
    };
    this.selectedEditImage = null;
  }

  async saveEdit(item: ItemModel): Promise<void> {
    const name = sanitizeText(this.editItemModel.name, { maxLength: 100 });
    const description = sanitizeText(this.editItemModel.description, { maxLength: 1000, multiline: true });

    if (!name) {
      this.showToast('O nome do item é obrigatório', 'error');
      return;
    }
    if (containsSuspiciousPattern(name) || containsSuspiciousPattern(description)) {
      this.showToast('Conteúdo inválido detectado nos campos.', 'error');
      return;
    }

    const quantity = Number(this.editItemModel.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
      this.showToast('A quantidade deve ser um número entre 1 e 1.000.000', 'error');
      return;
    }

    this.editItemModel.name = name;
    this.editItemModel.description = description;
    this.editItemModel.quantity = quantity;

    if (this.selectedEditImage) {
      const result = await validateImageFile(this.selectedEditImage);
      if (!result.ok) {
        this.showToast(result.error ?? 'Imagem inválida.', 'error');
        return;
      }
    }

    try {
      const updatedItem = await this.itemService.updateItem(this.editItemModel, this.selectedEditImage ?? undefined);
      Object.assign(item, updatedItem);
      this.editingItemId = null;
      this.selectedEditImage = null;
      this.showToast('Item atualizado com sucesso!', 'success');
      this.fetchItems();
    } catch (err) {
      console.error('Erro ao atualizar item', err);
      this.showToast('Erro ao atualizar item', 'error');
    }
  }

  cancelEdit(): void {
    this.editingItemId = null;
  }

  deleteItemConfirm(itemId: string): void {
    const item = this.items.find(i => i.id === itemId);
    const name = item?.name ?? 'este item';
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '95vw',
        maxWidth: '420px',
        autoFocus: 'first-tabbable',
        data: {
          title: 'Excluir item',
          message: `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
          confirmLabel: 'Excluir',
          confirmColor: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.confirmDelete(itemId);
        }
      });
  }

  confirmDelete(itemId: string): void {
    this.itemService.deleteItem(itemId)
      .then(() => {
        this.items = this.items.filter(i => i.id !== itemId);
        this.totalRecords--;
      })
      .catch(err => console.error('Erro ao excluir item', err));
  }

  changeQuantity(item: ItemModel, delta: number): void {
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      this.deleteItemConfirm(item.id);
      return;
    }

    this.itemService.patchItem(item.id, { quantity: newQuantity })
      .then(() => item.quantity = newQuantity)
      .catch(err => console.error('Erro ao atualizar quantidade', err));
  }

  async handleAddImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const result = await validateImageFile(file);
    if (!result.ok) {
      (event.target as HTMLInputElement).value = '';
      this.selectedAddImage = null;
      this.showToast(result.error ?? 'Imagem inválida.', 'error');
      return;
    }

    this.selectedAddImage = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.newItem.imgUrl = String(e.target?.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  async handleEditImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const result = await validateImageFile(file);
    if (!result.ok) {
      (event.target as HTMLInputElement).value = '';
      this.selectedEditImage = null;
      this.showToast(result.error ?? 'Imagem inválida.', 'error');
      return;
    }

    this.selectedEditImage = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.editItemModel.imgUrl = String(e.target?.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  resetForm(): void {
    this.newItem = {
      id: '',
      name: '',
      description: '',
      quantity: 0,
      boxId: '',
      boxName: '',
      imgUrl: ''
    };
  }

  goBack() {
    this.router.navigateByUrl('/home');
  }

  onSearchChange(name: string): void {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      const sanitized = sanitizeSearchTerm(name);
      this.searchName = sanitized;
      if (!sanitized) {
        this.fetchItems();
        return;
      }
      this.searchByName(sanitized);
    }, 400);
  }

  searchByName(name: string): void {
    const sanitized = sanitizeSearchTerm(name);
    if (!sanitized) {
      this.showToast('Por favor, digite um nome válido para buscar');
      return;
    }
    this.loading = true;

    this.itemService.getItemByName(sanitized)
      .then(items => {
        this.items = items;
        this.loading = false;
      })
      .catch(err => {
        console.error('Erro ao buscar item por nome', err);
        this.items = [];
        this.loading = false;
      });
  }

  handleImgError(event: any): void {
    event.target.src = 'assets/default-item-image.jpeg';
  }

  getImageUrl(url: string | null | undefined): string {
    const fallback = 'assets/default-item-image.jpeg';
    if (!url) return fallback;
    const trimmed = url.trim();
    if (!trimmed) return fallback;

    // Permite apenas esquemas seguros, evitando javascript:/vbscript:/file: etc.
    if (/^(https?:|data:image\/(png|jpe?g|gif|webp);|blob:)/i.test(trimmed)) {
      return trimmed;
    }
    // Caminhos relativos (ex.: "assets/...") tamb\u00e9m s\u00e3o aceitos.
    if (/^[\w./-]+$/.test(trimmed) && !trimmed.includes('..')) {
      return trimmed;
    }
    return fallback;
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
    this.fetchItems();
  }


  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetchItems();
  }
}
