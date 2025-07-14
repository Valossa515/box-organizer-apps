import { Injectable } from "@angular/core";
import axios from 'axios';
import { environment } from '../environments/environment';
import { CreateUserRequest } from "../app/models/register-model";

@Injectable({
  providedIn: 'root'
})
export class UserService {

    async createUser(user: CreateUserRequest): Promise<CreateUserRequest> {
      const response = await axios.post(`${environment.apiUrl}/users/v1/create`, user);
      return response.data;
    }
}