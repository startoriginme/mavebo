import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Админка пропускается без проверки авторизации
  if (pathname.startsWith('/admin')) {
    // Вызываем updateSession без редиректов или просто возвращаем next()
    // Чтобы сохранить функциональность cookies, но без редиректов
    const response = await updateSession(request)
    return response
  }
  
  // Для всех остальных маршрутов — обычная проверка
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
