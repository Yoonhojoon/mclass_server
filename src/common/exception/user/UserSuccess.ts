import { BaseSuccess } from '../BaseSuccess.js';

export class UserSuccess extends BaseSuccess {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'USER_SUCCESS',
    data?: any
  ) {
    super(message, statusCode, successCode, data);
  }

  static signupSuccess(userId: string, data?: any) {
    const message = `회원가입이 성공적으로 완료되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess(message, 201, 'USER_SIGNUP_SUCCESS', data);
  }

  static emailVerificationSent(email: string) {
    const message = `이메일 인증 링크가 ${email}로 발송되었습니다.`;
    return new UserSuccess(message, 200, 'EMAIL_VERIFICATION_SENT');
  }

  static emailVerificationSuccess(email: string) {
    const message = `${email} 이메일 인증이 완료되었습니다.`;
    return new UserSuccess(message, 200, 'EMAIL_VERIFICATION_SUCCESS');
  }

  static profileUpdateSuccess(field: string, data?: any) {
    const message = `${field}이(가) 성공적으로 업데이트되었습니다.`;
    return new UserSuccess(message, 200, 'PROFILE_UPDATE_SUCCESS', data);
  }

  static profileGetSuccess(data?: any) {
    const message = '프로필 정보를 성공적으로 조회했습니다.';
    return new UserSuccess(message, 200, 'PROFILE_GET_SUCCESS', data);
  }

  static passwordChangeSuccess() {
    const message = '비밀번호가 성공적으로 변경되었습니다.';
    return new UserSuccess(message, 200, 'PASSWORD_CHANGE_SUCCESS');
  }

  static passwordResetEmailSent(email: string) {
    const message = `비밀번호 재설정 이메일이 ${email}로 발송되었습니다.`;
    return new UserSuccess(message, 200, 'PASSWORD_RESET_EMAIL_SENT');
  }

  static passwordResetSuccess() {
    const message = '비밀번호가 성공적으로 재설정되었습니다.';
    return new UserSuccess(message, 200, 'PASSWORD_RESET_SUCCESS');
  }

  static accountDeleteSuccess() {
    const message = '계정이 성공적으로 삭제되었습니다.';
    return new UserSuccess(message, 200, 'ACCOUNT_DELETE_SUCCESS');
  }

  static accountActivationSuccess() {
    const message = '계정이 성공적으로 활성화되었습니다.';
    return new UserSuccess(message, 200, 'ACCOUNT_ACTIVATION_SUCCESS');
  }

  static accountDeactivationSuccess() {
    const message = '계정이 성공적으로 비활성화되었습니다.';
    return new UserSuccess(message, 200, 'ACCOUNT_DEACTIVATION_SUCCESS');
  }

  static usersFetchSuccess(count: number, data?: any) {
    const message = `총 ${count}명의 사용자를 성공적으로 조회했습니다.`;
    return new UserSuccess(message, 200, 'USERS_FETCH_SUCCESS', data);
  }

  static userDetailsFetchSuccess(data?: any) {
    const message = '사용자 상세 정보를 성공적으로 조회했습니다.';
    return new UserSuccess(message, 200, 'USER_DETAILS_FETCH_SUCCESS', data);
  }

  static userCreationSuccess(userId: string, data?: any) {
    const message = `사용자가 성공적으로 생성되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess(message, 201, 'USER_CREATION_SUCCESS', data);
  }

  static userUpdateSuccess(userId: string, data?: any) {
    const message = `사용자 정보가 성공적으로 업데이트되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess(message, 200, 'USER_UPDATE_SUCCESS', data);
  }

  static userDeletionSuccess(userId: string) {
    const message = `사용자가 성공적으로 삭제되었습니다. (사용자 ID: ${userId})`;
    return new UserSuccess(message, 200, 'USER_DELETION_SUCCESS');
  }
} 