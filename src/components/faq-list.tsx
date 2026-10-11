'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { faqs } from '@/config/faqs'

export function FaqList() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  return (
    <div className="faq-list">
      {faqs.map((item, index) => {
        const expanded = activeFaq === index
        const answerId = `faq-answer-${index}`
        return (
          <div className="faq-item" key={item.q}>
            <button
              className="faq-question"
              aria-expanded={expanded}
              aria-controls={answerId}
              onClick={() => setActiveFaq(expanded ? null : index)}
            >
              {item.q}<Plus size={17} />
            </button>
            <div className="faq-answer" id={answerId} hidden={!expanded}><p>{item.a}</p></div>
          </div>
        )
      })}
    </div>
  )
}
