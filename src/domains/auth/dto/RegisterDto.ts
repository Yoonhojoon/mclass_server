export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  role?: 'USER';
}
