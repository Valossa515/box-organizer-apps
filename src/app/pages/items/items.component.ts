import { ItemModel } from './../../models/item-model';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { ItemService } from '../../../services/item.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BoxService } from '../../../services/box.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, MatCardModule, HttpClientModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
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
  confirmDeleteItemId: string | null = null;
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
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.boxId = this.route.snapshot.params['boxId'];
    this.fetchItems();
    this.fetchBoxName();
  }

  fetchBoxName(): void {
    this.boxService.getBoxes(this.currentPage, this.pageSize)
      .then(result => {
        const box = result.data.find(b => b.id === this.boxId);
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
        this.items = result.data;
        this.totalRecords = result.totalRecords;
        this.loading = false;
      })
      .catch(err => {
        console.error('Erro ao buscar itens', err);
        this.loading = false;
      });
  }

  async createItem(): Promise<void> {
    // Validação mais robusta
    if (!this.newItem.name?.trim()) {
      this.showToast('O nome do item é obrigatório', 'error');
      return;
    }

    if (!this.newItem.quantity || this.newItem.quantity <= 0) {
      this.showToast('A quantidade deve ser maior que zero', 'error');
      return;
    }

    // Garantir que o boxId está definido
    this.newItem.boxId = this.boxId;
    this.newItem.quantity = Number(this.newItem.quantity); // Garantir que é número

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
    // Validação robusta
    if (!this.editItemModel.name?.trim()) {
      this.showToast('O nome do item é obrigatório', 'error');
      return;
    }

    if (!this.editItemModel.quantity || this.editItemModel.quantity <= 0) {
      this.showToast('A quantidade deve ser maior que zero', 'error');
      return;
    }

    // Garantir que os tipos estão corretos
    this.editItemModel.quantity = Number(this.editItemModel.quantity);

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
    this.confirmDeleteItemId = itemId;
  }

  confirmDelete(itemId: string): void {
    this.itemService.deleteItem(itemId)
      .then(() => {
        this.items = this.items.filter(i => i.id !== itemId);
        this.totalRecords--;
        this.confirmDeleteItemId = null;
      })
      .catch(err => console.error('Erro ao excluir item', err));
  }

  cancelDelete(): void {
    this.confirmDeleteItemId = null;
  }

  changeQuantity(item: ItemModel, delta: number): void {
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      this.deleteItemConfirm(item.id);
      return;
    }

    this.itemService.patchItem(item.id, newQuantity)
      .then(() => item.quantity = newQuantity)
      .catch(err => console.error('Erro ao atualizar quantidade', err));
  }

  handleAddImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedAddImage = file;
      // Cria uma URL temporária para pré-visualização
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newItem.imgUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  handleEditImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedEditImage = file;
      // Cria uma URL temporária para pré-visualização
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editItemModel.imgUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
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
      if (!name.trim()) {
        this.fetchItems();
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

    this.itemService.getItemByName(name)
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
    return url && url.trim() ? url : 'assets/default-item-image.jpeg';
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
