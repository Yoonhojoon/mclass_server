import { BaseSuccess } from '../BaseSuccess.js';

export class ClassSuccess extends BaseSuccess {
  constructor(
    message: string,
    statusCode: number = 200,
    successCode: string = 'CLASS_SUCCESS',
    data?: any
  ) {
    super(message, statusCode, successCode, data);
  }

  static classCreateSuccess(classId: string, className: string, data?: any) {
    const message = `클래스 "${className}"이(가) 성공적으로 생성되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 201, 'CLASS_CREATE_SUCCESS', data);
  }

  static classUpdateSuccess(field: string, data?: any) {
    const message = `클래스 ${field}이(가) 성공적으로 업데이트되었습니다.`;
    return new ClassSuccess(message, 200, 'CLASS_UPDATE_SUCCESS', data);
  }

  static classDeleteSuccess(classId: string) {
    const message = `클래스가 성공적으로 삭제되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 200, 'CLASS_DELETE_SUCCESS');
  }

  static classGetSuccess(data?: any) {
    const message = '클래스 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess(message, 200, 'CLASS_GET_SUCCESS', data);
  }

  static classListGetSuccess(count: number, data?: any) {
    const message = `총 ${count}개의 클래스를 성공적으로 조회했습니다.`;
    return new ClassSuccess(message, 200, 'CLASS_LIST_GET_SUCCESS', data);
  }

  static classDetailsGetSuccess(data?: any) {
    const message = '클래스 상세 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess(message, 200, 'CLASS_DETAILS_GET_SUCCESS', data);
  }

  static classActivationSuccess(classId: string) {
    const message = `클래스가 성공적으로 활성화되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 200, 'CLASS_ACTIVATION_SUCCESS');
  }

  static classDeactivationSuccess(classId: string) {
    const message = `클래스가 성공적으로 비활성화되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 200, 'CLASS_DEACTIVATION_SUCCESS');
  }

  static classPublishSuccess(classId: string) {
    const message = `클래스가 성공적으로 공개되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 200, 'CLASS_PUBLISH_SUCCESS');
  }

  static classUnpublishSuccess(classId: string) {
    const message = `클래스가 성공적으로 비공개되었습니다. (클래스 ID: ${classId})`;
    return new ClassSuccess(message, 200, 'CLASS_UNPUBLISH_SUCCESS');
  }

  static classScheduleUpdateSuccess(data?: any) {
    const message = '클래스 일정이 성공적으로 업데이트되었습니다.';
    return new ClassSuccess(message, 200, 'CLASS_SCHEDULE_UPDATE_SUCCESS', data);
  }

  static classScheduleGetSuccess(data?: any) {
    const message = '클래스 일정을 성공적으로 조회했습니다.';
    return new ClassSuccess(message, 200, 'CLASS_SCHEDULE_GET_SUCCESS', data);
  }

  static classCapacityUpdateSuccess(newCapacity: number) {
    const message = `클래스 정원이 ${newCapacity}명으로 성공적으로 업데이트되었습니다.`;
    return new ClassSuccess(message, 200, 'CLASS_CAPACITY_UPDATE_SUCCESS');
  }

  static classCapacityGetSuccess(data?: any) {
    const message = '클래스 정원 정보를 성공적으로 조회했습니다.';
    return new ClassSuccess(message, 200, 'CLASS_CAPACITY_GET_SUCCESS', data);
  }

  static classCategoryUpdateSuccess(data?: any) {
    const message = '클래스 카테고리가 성공적으로 업데이트되었습니다.';
    return new ClassSuccess(message, 200, 'CLASS_CATEGORY_UPDATE_SUCCESS', data);
  }

  static classCategoryGetSuccess(data?: any) {
    const message = '클래스 카테고리를 성공적으로 조회했습니다.';
    return new ClassSuccess(message, 200, 'CLASS_CATEGORY_GET_SUCCESS', data);
  }

  static classSearchSuccess(keyword: string, count: number, data?: any) {
    const message = `"${keyword}" 검색 결과 ${count}개의 클래스를 찾았습니다.`;
    return new ClassSuccess(message, 200, 'CLASS_SEARCH_SUCCESS', data);
  }

  static classFilterSuccess(count: number, data?: any) {
    const message = `필터링 결과 ${count}개의 클래스를 찾았습니다.`;
    return new ClassSuccess(message, 200, 'CLASS_FILTER_SUCCESS', data);
  }
} 