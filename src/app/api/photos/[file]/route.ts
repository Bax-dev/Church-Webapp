import { HttpError, requireUser, route } from '@/lib/server/api'
import { readPhoto } from '@/lib/server/photos'

/** Photos are personal data: only their owner and Super Admins can load them. */
export const GET = route<{ file: string }>(async (request, { params }) => {
  const user = await requireUser(request)
  const photo = await readPhoto((await params).file)
  if (!photo || (photo.ownerId !== user.id && user.role !== 'SUPER_ADMIN')) throw new HttpError(404, 'Not found.')
  return new Response(photo.bytes, {
    headers: { 'Content-Type': photo.type, 'Cache-Control': 'private, max-age=86400, immutable', 'X-Content-Type-Options': 'nosniff' },
  })
})
