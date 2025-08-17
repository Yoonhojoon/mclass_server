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
  } | null;
}

interface EnrollmentData {
  mclass: EnrollmentMclass;
  enrollmentForm: Record<string, unknown> | null;
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
