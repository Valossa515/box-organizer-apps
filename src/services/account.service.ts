import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
  async deleteAccount(): Promise<void> {
    await axios.delete(`${environment.apiUrl}/me/v1`);
  }
}
