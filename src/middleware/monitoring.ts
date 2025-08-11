import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';
import logger from '../config/logger.config.js';

// 메트릭 정의
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestSize = new promClient.Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000],
});

const httpResponseSize = new promClient.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 5000, 10000, 50000],
});

// 메트릭 수집 미들웨어
export const prometheusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const route = req.route?.path || req.path;

  // 요청 크기 측정
  const requestSize = parseInt(req.get('content-length') || '0');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseSize = parseInt(res.get('content-length') || '0');

    // 메트릭 기록
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration / 1000);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();

    if (requestSize > 0) {
      httpRequestSize.labels(req.method, route).observe(requestSize);
    }

    if (responseSize > 0) {
      httpResponseSize
        .labels(req.method, route, res.statusCode.toString())
        .observe(responseSize);
    }

    // 로그 기록 (느린 요청이나 에러만)
    if (duration > 1000) {
      logger.warn(
        `[Monitoring] 느린 요청 감지: ${req.method} ${route} - ${duration}ms`
      );
    }

    if (res.statusCode >= 400) {
      logger.warn(
        `[Monitoring] 에러 응답: ${req.method} ${route} - ${res.statusCode}`
      );
    }
  });

  next();
};

// 메트릭 엔드포인트
export const metricsEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logger.debug(`[Monitoring] 메트릭 엔드포인트 요청: ${req.ip}`);
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
    logger.debug(`[Monitoring] 메트릭 엔드포인트 응답 완료`);
  } catch (error) {
    logger.error(`[Monitoring] 메트릭 수집 오류`, {
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).json({ error: '메트릭 수집 실패' });
  }
};

// 기본 메트릭 수집
promClient.collectDefaultMetrics();
