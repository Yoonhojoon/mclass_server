import { AuthService } from '../../domains/auth/auth.service.js';

// Mock dependencies
jest.mock('../../domains/user/user.service');
jest.mock('../../domains/token/token.service');
jest.mock('../../config/logger.config', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      term: {
        findMany: jest.fn(),
      },
      userTerm: {
        create: jest.fn(),
      },
    };

    authService = new AuthService(mockPrisma);
  });

  describe('기본 테스트', () => {
    it('✅ AuthService 인스턴스가 생성되어야 함', () => {
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('✅ AuthService가 Prisma 인스턴스를 받아야 함', () => {
      expect(authService).toBeDefined();
    });
  });
});
