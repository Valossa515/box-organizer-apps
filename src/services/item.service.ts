import { Injectable } from '@angular/core';
import axios from 'axios';
import { ItemModel, ItemOrderBy } from '../app/models/item-model';
import { SortDirection } from '../app/models/box-model';
import { environment } from '../environments/environment';
import { PagedResult } from '../app/models/paged-result.model';
import { ApiResponse } from '../app/models/api-response.model';
import { sanitizeIdentifier, sanitizeSearchTerm } from '../app/core/security/input-sanitizer';

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (!envelope || !envelope.success) {
    throw new Error(envelope?.error ?? 'Erro na requisição');
  }
  return envelope.data as T;
}

@Injectable({ providedIn: 'root' })
export class ItemService {

  async getItems(
    boxId: string,
    pageNumber = 1,
    pageSize = 10,
    orderBy: ItemOrderBy = 'CREATED_AT',
    sortDirection: SortDirection = 'DESC'
  ): Promise<PagedResult<ItemModel>> {
    const safeBoxId = sanitizeIdentifier(boxId);
    const res = await axios.get<ApiResponse<PagedResult<ItemModel>>>(
      `${environment.apiUrl}/items/v1`,
      { params: { boxId: safeBoxId, pageNumber, pageSize, orderBy, sortDirection } }
    );
    return unwrap(res.data);
  }

  async createItem(item: ItemModel, imageFile?: File): Promise<ItemModel> {
    const safeBoxId = sanitizeIdentifier(item.boxId);
    const formData = new FormData();
    formData.append('name', item.name);
    formData.append('description', item.description ?? '');
    formData.append('quantity', String(item.quantity));
    formData.append('boxId', safeBoxId);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.post<ApiResponse<ItemModel>>(
      `${environment.apiUrl}/items/v1/create`,
      formData
    );
    return unwrap(res.data);
  }

  async updateItem(item: ItemModel, imageFile?: File): Promise<ItemModel> {
    const safeId = sanitizeIdentifier(item.id);
    const formData = new FormData();
    formData.append('name', item.name);
    formData.append('description', item.description ?? '');
    formData.append('quantity', String(item.quantity));
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.put<ApiResponse<ItemModel>>(
      `${environment.apiUrl}/items/v1/update/${safeId}`,
      formData
    );
    return unwrap(res.data);
  }

  async deleteItem(itemId: string): Promise<void> {
    const safeId = sanitizeIdentifier(itemId);
    await axios.delete(`${environment.apiUrl}/items/v1/delete/${safeId}`);
  }

  async getItemByName(name: string): Promise<ItemModel[]> {
    const safeName = sanitizeSearchTerm(name);
    if (!safeName) return [];
    const res = await axios.get<ApiResponse<ItemModel[]>>(
      `${environment.apiUrl}/items/v1/by-name/${encodeURIComponent(safeName)}`
    );
    return unwrap(res.data);
  }

  /**
   * PATCH parcial. Backend espera multipart; envia apenas os campos informados.
   * Útil para alterar somente a quantidade.
   */
  async patchItem(
    itemId: string,
    fields: { name?: string; description?: string; quantity?: number },
    imageFile?: File
  ): Promise<ItemModel> {
    const safeId = sanitizeIdentifier(itemId);
    const formData = new FormData();
    if (fields.name !== undefined) formData.append('name', fields.name);
    if (fields.description !== undefined) formData.append('description', fields.description);
    if (fields.quantity !== undefined) formData.append('quantity', String(fields.quantity));
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.patch<ApiResponse<ItemModel>>(
      `${environment.apiUrl}/items/v1/update/${safeId}`,
      formData
    );
    return unwrap(res.data);
  }
}