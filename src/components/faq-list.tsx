'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import type { SiteContent } from '@/config/content'

export function FaqList({ items }: { items: SiteContent['faqs']['list']['items'] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const expanded = activeFaq === index
        const answerId = `faq-answer-${index}`
        return (
          <div className="faq-item" key={index}>
            <button
              className="faq-question"
              aria-expanded={expanded}
              aria-controls={answerId}
              onClick={() => setActiveFaq(expanded ? null : index)}
            >
              {item.question}<Plus size={17} />
            </button>
            <div className="faq-answer" id={answerId} hidden={!expanded}><p>{item.answer}</p></div>
          </div>
        )
      })}
    </div>
  )
}
