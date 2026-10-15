import type { StaticImageData } from 'next/image'

import bibleStudy from '@/assets/bible-study.jpg'
import choir from '@/assets/choir.jpg'
import gathering from '@/assets/community-gathering.png'
import logo from '@/assets/logo.jpg'
import outreach from '@/assets/outreach.jpg'
import sundaySchool from '@/assets/sunday-school.jpg'
import worship from '@/assets/worship.jpg'
import youth from '@/assets/youth.jpg'

/**
 * The images bundled with the site. They are the defaults for every image slot in the site content
 * (src/config/content.ts); Super Admins can swap any slot for an uploaded photo at /admin/content.
 * Every bundled photo is an AI-generated illustration, not a photograph of the Centre or its members, and the alt text says so.
 */
export const images = {
  gathering: { src: gathering, alt: 'Illustrative image of people greeting one another in a church hall; not a photograph of the Centre.' },
  worship: { src: worship, alt: 'Illustrative image of a congregation standing to sing in worship; not a photograph of the Centre.' },
  choir: { src: choir, alt: 'Illustrative image of a robed choir singing; not a photograph of the Centre.' },
  'bible-study': { src: bibleStudy, alt: 'Illustrative image of a small group studying the Bible in a living room; not a photograph of the Centre.' },
  outreach: { src: outreach, alt: 'Illustrative image of volunteers handing out food and water on a street; not a photograph of the Centre.' },
  youth: { src: youth, alt: 'Illustrative image of young adults talking and playing guitar in a circle; not a photograph of the Centre.' },
  logo: { src: logo, alt: 'Emblem of The Presbyterian Church of Nigeria' },
  'sunday-school': { src: sundaySchool, alt: "Illustrative image of a teacher reading a story to young children; not a photograph of the Centre." },
} satisfies Record<string, { src: StaticImageData; alt: string }>

export type ImageKey = keyof typeof images

export const imageKeys = Object.keys(images) as ImageKey[]
