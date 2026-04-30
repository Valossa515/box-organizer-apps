import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../environments/environment';
import { ApiResponse } from '../app/models/api-response.model';
import {
  AcceptConsentRequest,
  AcceptConsentResponse,
  PendingConsent
} from '../app/models/consent.model';

function unwrap<T>(envelope: ApiResponse<T>): T {
  if (!envelope || !envelope.success) {
    throw new Error(envelope?.error ?? 'Erro na requisição');
  }
  return envelope.data as T;
}

@Injectable({ providedIn: 'root' })
export class ConsentService {

  /** Lista documentos legais que o usuário ainda precisa aceitar. */
  async getRequired(): Promise<PendingConsent[]> {
    const res = await axios.get<ApiResponse<PendingConsent[]>>(
      `${environment.apiUrl}/consents/v1/required`
    );
    return unwrap(res.data) ?? [];
  }

  /** Registra o aceite de um documento na versão informada. */
  async accept(request: AcceptConsentRequest): Promise<AcceptConsentResponse> {
    const res = await axios.post<ApiResponse<AcceptConsentResponse>>(
      `${environment.apiUrl}/consents/v1/accept`,
      request
    );
    return unwrap(res.data);
  }
}
