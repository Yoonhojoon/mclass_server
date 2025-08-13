import { BaseSuccess } from '../BaseSuccess.js';

export class MClassSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string = 'MClass 작업이 성공적으로 완료되었습니다',
    statusCode: number = 200,
    successCode: string = 'MCLASS_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  /**
   * 생성 성공 응답
   */
  static created<T>(id: string, data?: T): MClassSuccess<T> {
    return new MClassSuccess(
      'MClass가 성공적으로 생성되었습니다',
      201,
      'MCLASS_CREATED',
      data,
      { id }
    );
  }

  /**
   * 수정 성공 응답
   */
  static updated<T>(id: string, data?: T): MClassSuccess<T> {
    return new MClassSuccess(
      'MClass가 성공적으로 수정되었습니다',
      200,
      'MCLASS_UPDATED',
      data,
      { id }
    );
  }

  /**
   * 삭제 성공 응답
   */
  static deleted(id: string): MClassSuccess {
    return new MClassSuccess(
      'MClass가 성공적으로 삭제되었습니다',
      200,
      'MCLASS_DELETED',
      undefined,
      { id }
    );
  }

  /**
   * 목록 조회 성공 응답
   */
  static list<T>(
    data: T[],
    meta: { page: number; size: number; total: number; totalPages: number }
  ): MClassSuccess<T[]> {
    return new MClassSuccess(
      'MClass 목록을 성공적으로 조회했습니다',
      200,
      'MCLASS_LIST_RETRIEVED',
      data,
      meta
    );
  }

  /**
   * 단일 조회 성공 응답
   */
  static retrieved<T>(data: T): MClassSuccess<T> {
    return new MClassSuccess(
      'MClass를 성공적으로 조회했습니다',
      200,
      'MCLASS_RETRIEVED',
      data,
      undefined
    );
  }
}
