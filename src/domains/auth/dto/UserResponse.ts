export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  isSignUpCompleted: boolean;
  provider?: string;
}
