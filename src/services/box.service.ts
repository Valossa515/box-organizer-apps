import axios from "axios";
import { BoxModel } from "../app/models/box-model";
import { environment } from "../environments/environment";
import { PagedResult } from "../app/models/paged-result.model";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class BoxService {

  async getBoxes(pageNumber = 1, pageSize = 10): Promise<PagedResult<BoxModel>> {
    const res = await axios.get(`${environment.apiUrl}/box/v1`, {
      params: {
        Sort: 'desc',
        OrderBy: 'name',
        PageNumber: pageNumber,
        PageSize: pageSize
      }
    });
    return res.data;
  }

  async createBox(box: BoxModel, imageFile?: File): Promise<BoxModel> {
    const formData = new FormData();

    // Adiciona os campos ao FormData
    formData.append('Name', box.name);
    formData.append('Description', box.description || '');

    // A imagem, se existir
    if (imageFile) {
      formData.append('Image', imageFile, imageFile.name);
    }

    // Envia o POST com multipart/form-data
    const res = await axios.post(`${environment.apiUrl}/box/v1/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return res.data;
  }

  async getBoxByName(name: string): Promise<BoxModel[]> {
    const res = await axios.get<BoxModel[]>(`${environment.apiUrl}/box/v1/by-name/${name}`);
    return res.data;
  }
}