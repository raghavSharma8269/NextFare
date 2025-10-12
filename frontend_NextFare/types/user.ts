export interface User {
  uid: string;
  email: string;
  username: string;
  lastLocation?: LastLocation;
  createdAt?: string;
  updatedAt?: string;
}

export interface LastLocation {
  latitude: number;
  longitude: number;
}

export interface CreateUserRequest {
  username: string;
  lastLocation?: LastLocation;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}
