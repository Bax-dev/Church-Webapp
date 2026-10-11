import { eq } from 'drizzle-orm'

import { HttpError, clientIp, ok, requireUser, route } from '@/lib/server/api'
import { audit } from '@/lib/server/audit'
import { db, schema } from '@/lib/server/db'
import { deletePhoto, savePhoto } from '@/lib/server/photos'

/** Upload a profile photo: multipart field "photo", JPG or PNG up to 2 MB (PRD M-09). */
export const POST = route(async (request) => {
  const user = await requireUser(request)
  const form = await request.formData().catch(() => undefined)
  const file = form?.get('photo')
  if (!(file instanceof File)) throw new HttpError(422, 'Choose a photo to upload.', { photo: 'Choose a photo to upload.' })

  const saved = await savePhoto(user.id, file)
  if ('error' in saved) throw new HttpError(422, saved.error!, { photo: saved.error! })
  await db.update(schema.users).set({ photoUrl: saved.url }).where(eq(schema.users.id, user.id))
  await deletePhoto(user.photoUrl)
  await audit({ actor: user, target: user, action: 'profile.photo', detail: 'Profile photo changed', ip: clientIp(request) })
  return ok({ photoUrl: saved.url })
})

export const DELETE = route(async (request) => {
  const user = await requireUser(request)
  await db.update(schema.users).set({ photoUrl: null }).where(eq(schema.users.id, user.id))
  await deletePhoto(user.photoUrl)
  await audit({ actor: user, target: user, action: 'profile.photo', detail: 'Profile photo removed', ip: clientIp(request) })
  return ok({ photoUrl: null })
})
