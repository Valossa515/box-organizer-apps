import { PagedResult } from './../app/models/paged-result.model';
import { Injectable } from '@angular/core';
import axios from 'axios';
import { ItemModel } from '../app/models/item-model';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ItemService {

  async getItems(boxId: string, pageNumber = 1, pageSize = 10): Promise<PagedResult<ItemModel>> {
  const res = await axios.get(`${environment.apiUrl}/items/v1`, {
    params: {
      BoxId: boxId,
      Sort: 'desc',
      OrderBy: 'quantity',
      PageNumber: pageNumber,
      PageSize: pageSize
    }
  });
  return res.data;
}

  async createItem(item: ItemModel, imageFile?: File): Promise<ItemModel> {
    const formData = new FormData();

    // Adiciona cada campo individualmente ao FormData
    formData.append('Name', item.name);
    formData.append('Description', item.description || '');
    formData.append('Quantity', item.quantity.toString());
    formData.append('BoxId', item.boxId);

    // Adiciona a imagem se existir
    if (imageFile) {
      formData.append('Image', imageFile, imageFile.name);
    }

    const res = await axios.post(`${environment.apiUrl}/items/v1/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }

  async updateItem(item: ItemModel, imageFile?: File): Promise<ItemModel> {
    const formData = new FormData();

    // Adiciona cada campo individualmente
    formData.append('Id', item.id);
    formData.append('Name', item.name);
    formData.append('Description', item.description || '');
    formData.append('Quantity', item.quantity.toString());
    formData.append('BoxId', item.boxId);

    // Adiciona a imagem se existir
    if (imageFile) {
      formData.append('Image', imageFile, imageFile.name);
    }

    const res = await axios.put(`${environment.apiUrl}/items/v1/update/${item.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  }

  async deleteItem(itemId: string): Promise<void> {
    await axios.delete(`${environment.apiUrl}/items/v1/delete/${itemId}`);
  }

  async getItemByName(name: string): Promise<ItemModel[]> {
    const res = await axios.get<ItemModel[]>(`${environment.apiUrl}/items/v1/by-name/${name}`);
    return res.data;
  }

  async patchItem(itemId: string, quantity: number): Promise<void> {
    const res = await axios.patch(`${environment.apiUrl}/items/v1/update/${itemId}`, {
      quantity: quantity
    });
    return res.data;
  }
}