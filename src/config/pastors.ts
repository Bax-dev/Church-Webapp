/**
 * The pastors shown on the About page. Super Admins edit the list at /admin/pastors;
 * it is stored as one ordered list in the settings table, so the order on the page is the order in the editor.
 */
import { z } from 'zod'

export const PASTOR_PHOTO_ROUTE = '/api/pastor-photos'
export const MAX_PASTORS = 24

export const pastorSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1, 'Enter a name.').max(80, 'Keep the name under 80 characters.'),
  title: z.string().trim().min(1, 'Enter a title, like Senior Pastor.').max(60, 'Keep the title under 60 characters.'),
  bio: z.string().trim().max(500, 'Keep the bio under 500 characters.').default(''),
  /** Only photos uploaded through the editor, so the list can never point at another site. */
  photoUrl: z.string().regex(new RegExp(`^${PASTOR_PHOTO_ROUTE}/[\\w-]+\\.(jpg|png)$`)).nullable().default(null),
})

export const pastorsSchema = z.object({ pastors: z.array(pastorSchema).max(MAX_PASTORS, `Show at most ${MAX_PASTORS} pastors.`) })

export type Pastor = z.infer<typeof pastorSchema>

/** Stored JSON → pastors, dropping any entry that no longer validates rather than failing the whole page. */
export function parsePastors(raw: unknown): Pastor[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    const result = pastorSchema.safeParse(item)
    return result.success ? [result.data] : []
  })
}
