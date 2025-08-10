import { BaseSuccess } from '../BaseSuccess.js';

export class ClassSuccess<T = unknown> extends BaseSuccess<T> {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'CLASS_SUCCESS',
    data?: T,
    meta?: Record<string, unknown>
  ) {
    super(message, statusCode, successCode, data, meta);
  }

  static classCreateSuccess<T = unknown>(
    classId: string,
    className: string,
    data?: T
  ): ClassSuccess<T> {
    const message = `클래스 "${className}"이(가) 성공적으로 생성되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<T>(message, 201, 'CLASS_CREATE_SUCCESS', data);
  }

  static classUpdateSuccess<T = unknown>(
    field: string,
    data?: T
  ): ClassSuccess<T> {
    const message = `클래스 ${field}이(가) 성공적으로 업데이트되었습니다.`;
    return new ClassSuccess<T>(message, 200, 'CLASS_UPDATE_SUCCESS', data);
  }

  static classDeleteSuccess(classId: string): ClassSuccess<null> {
    const message = `클래스가 성공적으로 삭제되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<null>(message, 200, 'CLASS_DELETE_SUCCESS', null);
  }

  static classGetSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess<T>(message, 200, 'CLASS_GET_SUCCESS', data);
  }

  static classListGetSuccess<T = unknown>(
    count: number,
    data?: T
  ): ClassSuccess<T> {
    const message = `총 ${count}개의 클래스를 성공적으로 조회했습니다.`;
    return new ClassSuccess<T>(message, 200, 'CLASS_LIST_GET_SUCCESS', data, {
      count,
    });
  }

  static classDetailsGetSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 상세 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess<T>(message, 200, 'CLASS_DETAILS_GET_SUCCESS', data);
  }

  static classActivationSuccess(classId: string): ClassSuccess<null> {
    const message = `클래스가 성공적으로 활성화되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<null>(
      message,
      200,
      'CLASS_ACTIVATION_SUCCESS',
      null
    );
  }

  static classDeactivationSuccess(classId: string): ClassSuccess<null> {
    const message = `클래스가 성공적으로 비활성화되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<null>(
      message,
      200,
      'CLASS_DEACTIVATION_SUCCESS',
      null
    );
  }

  static classPublishSuccess(classId: string): ClassSuccess<null> {
    const message = `클래스가 성공적으로 공개되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<null>(message, 200, 'CLASS_PUBLISH_SUCCESS', null);
  }

  static classUnpublishSuccess(classId: string): ClassSuccess<null> {
    const message = `클래스가 성공적으로 비공개되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess<null>(
      message,
      200,
      'CLASS_UNPUBLISH_SUCCESS',
      null
    );
  }

  static classScheduleUpdateSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 일정이 성공적으로 업데이트되었습니다.';
    return new ClassSuccess<T>(
      message,
      200,
      'CLASS_SCHEDULE_UPDATE_SUCCESS',
      data
    );
  }

  static classScheduleGetSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 일정을 성공적으로 조회했습니다.';
    return new ClassSuccess<T>(
      message,
      200,
      'CLASS_SCHEDULE_GET_SUCCESS',
      data
    );
  }

  static classCapacityUpdateSuccess(newCapacity: number): ClassSuccess<null> {
    const message = `클래스 정원이 ${newCapacity}명으로 성공적으로 업데이트되었습니다.`;
    return new ClassSuccess<null>(
      message,
      200,
      'CLASS_CAPACITY_UPDATE_SUCCESS',
      null
    );
  }

  static classCapacityGetSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 정원 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess<T>(
      message,
      200,
      'CLASS_CAPACITY_GET_SUCCESS',
      data
    );
  }

  static classCategoryUpdateSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 카테고리가 성공적으로 업데이트되었습니다.';
    return new ClassSuccess<T>(
      message,
      200,
      'CLASS_CATEGORY_UPDATE_SUCCESS',
      data
    );
  }

  static classCategoryGetSuccess<T = unknown>(data?: T): ClassSuccess<T> {
    const message = '클래스 카테고리를 성공적으로 조회했습니다.';
    return new ClassSuccess<T>(
      message,
      200,
      'CLASS_CATEGORY_GET_SUCCESS',
      data
    );
  }

  static classSearchSuccess<T = unknown>(
    keyword: string,
    count: number,
    data?: T
  ): ClassSuccess<T> {
    const message = `"${keyword}" 검색 결과 ${count}개의 클래스를 찾았습니다.`;
    return new ClassSuccess<T>(message, 200, 'CLASS_SEARCH_SUCCESS', data, {
      count,
      keyword,
    });
  }

  static classFilterSuccess<T = unknown>(
    count: number,
    data?: T
  ): ClassSuccess<T> {
    const message = `필터링 결과 ${count}개의 클래스를 찾았습니다.`;
    return new ClassSuccess<T>(message, 200, 'CLASS_FILTER_SUCCESS', data, {
      count,
    });
  }
}
