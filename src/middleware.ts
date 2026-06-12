// ============================================================
// 全局中间件 — 速率限制 + 可选 API 认证
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';

// 需要速率限制的路径前缀
const RATE_LIMITED_PATHS = ['/api/chat/', '/api/judge', '/api/feedback', '/api/history', '/api/config'];

// 不需要认证的路径
const PUBLIC_PATHS = ['/api/models'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 只处理 API 路由
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 获取客户端 IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';

  // --- 可选 API 认证 ---
  const authToken = process.env.API_AUTH_TOKEN;
  if (authToken && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const provided = req.headers.get('authorization')?.replace('Bearer ', '');
    if (provided !== authToken) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }
  }

  // --- 速率限制 ---
  const needsRateLimit = RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p));
  if (needsRateLimit) {
    // POST/GET 写操作限制更严格
    const isMutation = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE';
    const result = checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: isMutation ? 20 : 60,
    });

    if (!result.allowed) {
      return NextResponse.json(
        { detail: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      );
    }

    // 正常响应也带上 Rate Limit headers
    const response = NextResponse.next();
    const headers = getRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
