import { describe, it, expect } from '@jest/globals';
import {
  userResponseSchema,
  loginResponseSchema,
} from '../auth/response.schema.js';
import { mClassResponseSchema } from '../mclass/response.schema.js';
import { termResponseSchema } from '../term/response.schema.js';

describe('Auth Response Schemas', () => {
  describe('userResponseSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        isAdmin: false,
        provider: 'LOCAL',
        social_id: null,
        created_at: '2025-01-15T10:00:00.000Z',
      };

      const result = userResponseSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
        name: 'Test User',
        role: 'USER',
        isAdmin: false,
        provider: 'LOCAL',
        social_id: null,
        created_at: '2025-01-15T10:00:00.000Z',
      };

      const result = userResponseSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('loginResponseSchema', () => {
    it('should validate valid login response', () => {
      const validLoginResponse = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
          isAdmin: false,
          provider: 'LOCAL',
          social_id: null,
          created_at: '2025-01-15T10:00:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      const result = loginResponseSchema.safeParse(validLoginResponse);
      expect(result.success).toBe(true);
    });
  });
});

describe('MClass Response Schemas', () => {
  describe('mClassResponseSchema', () => {
    it('should validate valid MClass data', () => {
      const validMClass = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Class',
        description: 'Test Description',
        recruitStartAt: '2025-01-15T10:00:00.000Z',
        recruitEndAt: '2025-01-20T10:00:00.000Z',
        startAt: '2025-01-25T10:00:00.000Z',
        endAt: '2025-01-25T12:00:00.000Z',
        selectionType: 'FIRST_COME',
        capacity: 20,
        approvedCount: 0,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC',
        isOnline: true,
        location: null,
        fee: 0,
        phase: 'UPCOMING',
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
      };

      const result = mClassResponseSchema.safeParse(validMClass);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phase', () => {
      const invalidMClass = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Class',
        description: 'Test Description',
        recruitStartAt: '2025-01-15T10:00:00.000Z',
        recruitEndAt: '2025-01-20T10:00:00.000Z',
        startAt: '2025-01-25T10:00:00.000Z',
        endAt: '2025-01-25T12:00:00.000Z',
        selectionType: 'FIRST_COME',
        capacity: 20,
        approvedCount: 0,
        allowWaitlist: false,
        waitlistCapacity: null,
        visibility: 'PUBLIC',
        isOnline: true,
        location: null,
        fee: 0,
        phase: 'INVALID_PHASE', // Invalid phase
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
      };

      const result = mClassResponseSchema.safeParse(invalidMClass);
      expect(result.success).toBe(false);
    });
  });
});

describe('Term Response Schemas', () => {
  describe('termResponseSchema', () => {
    it('should validate valid term data', () => {
      const validTerm = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'SERVICE',
        title: '서비스 이용약관',
        content: '서비스 이용에 관한 약관 내용입니다.',
        is_required: true,
        version: '1.0.0',
        created_at: '2025-01-15T10:00:00.000Z',
      };

      const result = termResponseSchema.safeParse(validTerm);
      expect(result.success).toBe(true);
    });

    it('should reject invalid term type', () => {
      const invalidTerm = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'INVALID_TYPE', // Invalid type
        title: '서비스 이용약관',
        content: '서비스 이용에 관한 약관 내용입니다.',
        is_required: true,
        version: '1.0.0',
        created_at: '2025-01-15T10:00:00.000Z',
      };

      const result = termResponseSchema.safeParse(invalidTerm);
      expect(result.success).toBe(false);
    });
  });
});
