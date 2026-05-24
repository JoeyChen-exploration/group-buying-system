import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export function unauthorized(message = "请先登录") {
  return fail(message, 401);
}

export function forbidden(message = "权限不足") {
  return fail(message, 403);
}

export function notFound(message = "资源不存在") {
  return fail(message, 404);
}

export function serverError(message = "服务器错误") {
  return fail(message, 500);
}
