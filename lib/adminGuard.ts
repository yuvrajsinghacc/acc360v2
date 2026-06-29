import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Server-side admin guard for API route handlers.
 * Returns a NextResponse (401 or 403) if the caller is not an admin; null if they are.
 *
 * Usage in a write handler:
 *   const guard = await requireAdmin()
 *   if (guard) return guard
 *
 * Uses currentUser() (not sessionClaims) so publicMetadata is always fresh
 * and no custom JWT template is required in Clerk.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()
  if (user?.publicMetadata?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: admin access required' },
      { status: 403 },
    )
  }

  return null
}
