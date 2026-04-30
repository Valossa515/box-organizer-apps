import axios from 'axios';
import { Injectable } from '@angular/core';
import { BoxModel, BoxOrderBy, SortDirection } from '../app/models/box-model';
import { environment } from '../environments/environment';
import { PagedResult } from '../app/models/paged-result.model';
import { ApiResponse } from '../app/models/api-response.model';

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (!envelope || !envelope.success) {
    throw new Error(envelope?.error ?? 'Erro na requisição');
  }
  return envelope.data as T;
}

@Injectable({ providedIn: 'root' })
export class BoxService {

  async getBoxes(
    pageNumber = 1,
    pageSize = 10,
    orderBy: BoxOrderBy = 'CREATED_AT',
    sortDirection: SortDirection = 'DESC'
  ): Promise<PagedResult<BoxModel>> {
    const res = await axios.get<ApiResponse<PagedResult<BoxModel>>>(
      `${environment.apiUrl}/box/v1`,
      { params: { pageNumber, pageSize, orderBy, sortDirection } }
    );
    return unwrap(res.data);
  }

  async getBoxById(id: string): Promise<BoxModel> {
    const res = await axios.get<ApiResponse<BoxModel>>(`${environment.apiUrl}/box/v1/${id}`);
    return unwrap(res.data);
  }

  async createBox(box: BoxModel, imageFile?: File): Promise<BoxModel> {
    const formData = new FormData();
    formData.append('name', box.name);
    formData.append('description', box.description ?? '');
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.post<ApiResponse<BoxModel>>(
      `${environment.apiUrl}/box/v1/create`,
      formData
    );
    return unwrap(res.data);
  }

  async updateBox(box: BoxModel, imageFile?: File): Promise<BoxModel> {
    const formData = new FormData();
    formData.append('name', box.name);
    formData.append('description', box.description ?? '');
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.put<ApiResponse<BoxModel>>(
      `${environment.apiUrl}/box/v1/update/${box.id}`,
      formData
    );
    return unwrap(res.data);
  }

  /** PATCH parcial: envia apenas os campos informados (multipart). */
  async patchBox(
    id: string,
    fields: { name?: string; description?: string },
    imageFile?: File
  ): Promise<BoxModel> {
    const formData = new FormData();
    if (fields.name !== undefined) formData.append('name', fields.name);
    if (fields.description !== undefined) formData.append('description', fields.description);
    if (imageFile) formData.append('image', imageFile, imageFile.name);

    const res = await axios.patch<ApiResponse<BoxModel>>(
      `${environment.apiUrl}/box/v1/update/${id}`,
      formData
    );
    return unwrap(res.data);
  }

  async deleteBox(id: string): Promise<void> {
    await axios.delete(`${environment.apiUrl}/box/v1/delete/${id}`);
  }

  async getBoxByName(name: string): Promise<BoxModel[]> {
    const res = await axios.get<ApiResponse<BoxModel[]>>(
      `${environment.apiUrl}/box/v1/by-name/${encodeURIComponent(name)}`
    );
    return unwrap(res.data);
  }
}