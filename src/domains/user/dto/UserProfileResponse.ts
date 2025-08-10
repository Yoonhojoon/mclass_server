interface MclassEnrollment {
  user: {
    name: string | null;
    email: string;
  };
}

interface MclassData {
  enrollments: MclassEnrollment[];
}

interface EnrollmentMclass {
  creator: {
    name: string | null;
    email: string;
  };
}

interface EnrollmentData {
  mclass: EnrollmentMclass;
  form: Record<string, unknown> | null;
}

export interface UserProfileResponse {
  email: string;
  name: string | null;
  isAdmin: boolean;
  provider: string;
  socialId: string | null;
  isSignUpCompleted: boolean;
  createdAt: Date;
  mclasses: MclassData[];
  enrollments: EnrollmentData[];
}
