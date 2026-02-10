import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: string[];
  profileId?: number | null;
  portfolioId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class UsersApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/users`;

  getUsers(): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>(this.baseUrl);
  }

  updateUserRoles(userId: number, roleNames: string[]): Observable<UserResponseDto> {
    return this.http.put<UserResponseDto>(`${this.baseUrl}/${userId}/roles`, { roleNames });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`);
  }
}
