import { connection } from 'next/server'

import { getPastors } from '@/lib/server/pastors'

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join('').toUpperCase()

/** "Our pastors", read from the database on each request so a save in /admin/pastors shows straight away. Hidden while the list is empty. */
export async function Pastors() {
  await connection()
  const pastors = await getPastors()
  if (pastors.length === 0) return null

  return (
    <section className="section pastors" id="pastors" aria-labelledby="pastors-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Our pastors</span>
          <h2 id="pastors-title">Shepherds who serve <em>with you.</em></h2>
          <p>Our pastors lead us in worship, teach the Word and walk alongside the congregation. Do say hello after a service.</p>
        </div>
        <ul className="pastor-grid">
          {pastors.map((pastor) => (
            <li key={pastor.id} className="pastor-card">
              <div className="pastor-photo">
                {pastor.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element -- uploaded at runtime, so next/image has no dimensions for it
                  ? <img src={pastor.photoUrl} alt={`Portrait of ${pastor.name}`} loading="lazy" />
                  : <span aria-hidden="true">{initialsOf(pastor.name)}</span>}
              </div>
              <h3>{pastor.name}</h3>
              <span className="pastor-title">{pastor.title}</span>
              {pastor.bio && <p>{pastor.bio}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
