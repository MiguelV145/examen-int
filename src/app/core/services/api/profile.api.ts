import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface ProfileUpdateDto {
  displayName?: string;
  specialty?: string;
  description?: string;
  skills?: string[];
  photoURL?: string;
}

export interface ProfileResponse {
  id: number;
  userId: number;
  displayName?: string;
  specialty?: string;
  description?: string;
  skills?: string[];
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  getMyProfile() {
    return this.http.get<ProfileResponse>(`${this.baseUrl}/api/profile/me`);
  }

  updateMyProfile(body: ProfileUpdateDto) {
    return this.http.put<ProfileResponse>(`${this.baseUrl}/api/profile/me`, body);
  }
}
