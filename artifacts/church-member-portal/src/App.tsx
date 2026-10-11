import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Cross, Heart, Menu, Plus, ShieldCheck, Users, X } from 'lucide-react';
import gatheringImage from './assets/community-gathering.png';

const questions = [
  {
    question: 'What is the Church Member Portal?',
    answer:
      'It is a welcoming digital home for a church community: a place for members to keep their details current and stay connected to their department and district, while leaders spend less time managing scattered information.',
  },
  {
    question: 'Can I create an account here?',
    answer:
      'Not yet. This page introduces the portal, but account registration and sign-in are not available here. Your church will share access instructions when the member portal is ready for your community.',
  },
  {
    question: 'Who can see my information?',
    answer:
      'Member information should be handled with care and made available only to the people who need it for church community and pastoral administration. Privacy and permissions belong in the portal itself, which is not connected on this page.',
  },
  {
    question: 'What if my details change?',
    answer:
      'The portal is designed to give members a straightforward way to keep their details up to date. Until access is available, please use the contact method your church already provides.',
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Cross size={18} strokeWidth={1.8} />
    </span>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [accessOpen, setAccessOpen] = useState(false);

  useEffect(() => {
    if (!accessOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccessOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [accessOpen]);

  const closeMenu = () => setMenuOpen(false);
  const openAccess = () => {
    closeMenu();
    setAccessOpen(true);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="topbar">
        <div className="container nav-inner">
          <a className="brand" href="#top" aria-label="Church Member Portal, home" onClick={closeMenu}>
            <BrandMark />
            <span>
              <span className="brand-name">Church Member Portal</span>
              <span className="brand-caption">A place to belong</span>
            </span>
          </a>
          <nav id="main-navigation" className={`nav-links${menuOpen ? ' open' : ''}`} aria-label="Main navigation">
            <a href="#the-portal" onClick={closeMenu}>The portal</a>
            <a href="#for-everyone" onClick={closeMenu}>For everyone</a>
            <a href="#our-values" onClick={closeMenu}>Our values</a>
            <a href="#questions" onClick={closeMenu}>Questions</a>
          </nav>
          <button className="nav-cta" onClick={openAccess}>Explore access <ArrowRight size={15} /></button>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-label eyebrow">A digital home for your church family</div>
              <h1 id="hero-title">Known by name.<br /><em>Connected</em> in faith.</h1>
              <p className="hero-intro">
                The people are the heart of a church. This is a simpler way to care for the details, so there is more room for the connection.
              </p>
              <div className="hero-actions">
                <button className="button-primary" onClick={openAccess}>Find out about access <ArrowRight size={16} /></button>
                <a className="button-secondary" href="#the-portal">Get to know the portal <ArrowDown size={15} /></a>
              </div>
              <p className="hero-note">A thoughtful home for member details, departments and districts.</p>
            </div>
            <div className="hero-art">
              <div className="hero-art-frame">
                <img src={gatheringImage} alt="Church community members sharing a relaxed moment together around a table." />
                <div className="art-caption"><small>Church is people</small>There is room for everyone at the table.</div>
              </div>
              <div className="floating-note" aria-label="A little less admin, a little more care">
                <strong>A little less admin.<br />A little more care.</strong>
                <span>Connection, made simpler.</span>
              </div>
              <div className="hero-stamp"><span>Belong<br />together</span></div>
            </div>
          </div>
        </section>

        <div className="marquee" aria-label="A shared life, made easier">
          <div className="container marquee-inner">
            <span>One community</span><i aria-hidden="true" />
            <span>Many stories</span><i aria-hidden="true" />
            <span>Room to belong</span>
          </div>
        </div>

        <section className="section why" id="the-portal" aria-labelledby="why-title">
          <div className="container why-grid">
            <div className="why-aside">
              <span className="eyebrow">A simple idea, with people at the centre</span>
              <h2 id="why-title">Less time chasing details. More time seeing one another.</h2>
              <p>Good care starts with knowing who is part of the family. The portal brings the essentials together, without letting admin get in the way of the human things.</p>
            </div>
            <div className="why-list">
              <article className="why-item">
                <span className="why-number">01</span>
                <div><h3>Your details, kept current</h3><p>Members can keep the information they share with their church up to date, all in one considered place.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">02</span>
                <div><h3>A clearer sense of belonging</h3><p>Stay connected to the department and district that shape your part in the wider church community.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">03</span>
                <div><h3>Care that is easier to coordinate</h3><p>Church leaders can spend less energy reconciling lists and more energy being present with people.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">04</span>
                <div><h3>One shared picture, handled thoughtfully</h3><p>Keep the community's information together and approach every detail with the respect it deserves.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section pathways" id="for-everyone" aria-labelledby="pathways-title">
          <div className="container">
            <div className="pathway-top">
              <div className="section-head">
                <span className="eyebrow">A place for every part of the family</span>
                <h2 id="pathways-title">Different roles.<br />One shared life.</h2>
                <p>Whether you are keeping your own information current or caring for the whole community, the portal is designed around the way church life really works.</p>
              </div>
            </div>
            <div className="pathways-grid">
              <article className="pathway-card members">
                <span className="card-note">For members</span>
                <span className="card-icon"><Heart size={19} strokeWidth={1.7} /></span>
                <div>
                  <h3>Your place in the community, close at hand.</h3>
                  <p>Keep your personal details current and see the church connections that help you feel at home.</p>
                  <button className="pathway-link" onClick={openAccess}>How member access works <ArrowRight size={15} /></button>
                </div>
              </article>
              <article className="pathway-card leaders">
                <span className="card-note">For church leaders</span>
                <span className="card-icon"><Users size={19} strokeWidth={1.7} /></span>
                <div>
                  <h3>Better information for more attentive care.</h3>
                  <p>Keep member, department and district information organised, so the important follow-through is easier.</p>
                  <button className="pathway-link" onClick={openAccess}>How leader access works <ArrowRight size={15} /></button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section experience" aria-labelledby="experience-title">
          <div className="container experience-layout">
            <div className="experience-art">
              <img src={gatheringImage} alt="A welcoming shared table in a church community gathering space." loading="lazy" />
            </div>
            <div className="experience-copy">
              <span className="eyebrow">Made for the life between Sundays, too</span>
              <h2 id="experience-title">A little more space for what matters.</h2>
              <p>When the practical details have a home, the people looking after them can give more attention to the people behind them.</p>
              <ul className="feature-list">
                <li><Check size={17} /><span>A clearer way to keep member details in one place</span></li>
                <li><Check size={17} /><span>Church departments and districts connected to the people in them</span></li>
                <li><Check size={17} /><span>Less time spent checking and re-checking administrative records</span></li>
                <li><Check size={17} /><span>A more considerate experience for members and leaders alike</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section values" id="our-values" aria-labelledby="values-title">
          <div className="container values-inner">
            <div>
              <span className="eyebrow">The way we believe it should feel</span>
              <h2 id="values-title">Technology<br />in its right place.</h2>
              <p className="values-intro">Useful, quietly dependable, and always in service of the relationships that make a church a community.</p>
            </div>
            <div className="values-words">
              <div className="value"><strong>Welcoming</strong><span>Clear and approachable, for people with all kinds of digital confidence.</span></div>
              <div className="value"><strong>Trustworthy</strong><span>Personal information is treated with dignity, care and purpose.</span></div>
              <div className="value"><strong>Grounded</strong><span>Built around real church connections, not abstract organisation charts.</span></div>
              <div className="value"><strong>Human</strong><span>A tool for caring for people, never a replacement for showing up.</span></div>
            </div>
          </div>
        </section>

        <section className="access" aria-labelledby="access-title">
          <div className="container access-card">
            <div>
              <span className="eyebrow">A note about getting started</span>
              <h2 id="access-title">Your church will show you the way in.</h2>
              <p>This page is an introduction, not a sign-in or registration service. When portal access is ready for your church, its leaders will share the right next steps with you.</p>
            </div>
            <div className="access-actions">
              <button className="button-primary" onClick={openAccess}>Understand access <ArrowRight size={16} /></button>
              <span>No account is created from this page.</span>
            </div>
          </div>
        </section>

        <section className="section faq" id="questions" aria-labelledby="faq-title">
          <div className="container faq-layout">
            <div className="faq-heading">
              <span className="eyebrow">Good to know</span>
              <h2 id="faq-title">A few things you may be wondering.</h2>
              <p>Have a question about how a member portal can serve a church community? Start here.</p>
            </div>
            <div className="faq-list">
              {questions.map((item, index) => {
                const expanded = activeFaq === index;
                const answerId = `faq-answer-${index}`;
                return (
                  <div className="faq-item" key={item.question}>
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
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-main">
            <div>
              <a className="brand" href="#top">
                <BrandMark />
                <span><span className="brand-name">Church Member Portal</span><span className="brand-caption">A place to belong</span></span>
              </a>
              <p className="footer-copy">A more thoughtful home for the details that help a church family stay connected.</p>
            </div>
            <nav className="footer-nav" aria-label="Footer navigation">
              <div className="footer-column">
                <strong>Explore</strong>
                <a href="#the-portal">The portal</a>
                <a href="#for-everyone">For everyone</a>
                <a href="#our-values">Our values</a>
              </div>
              <div className="footer-column">
                <strong>Next step</strong>
                <button onClick={openAccess}>About access</button>
                <a href="#questions">Common questions</a>
              </div>
            </nav>
          </div>
          <div className="footer-bottom">
            <span>Made to help people care for people.</span>
            <a className="back-top" href="#top">Back to the beginning <ArrowUp size={14} /></a>
          </div>
        </div>
      </footer>

      {accessOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAccessOpen(false);
        }}>
          <section className="access-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
            <button className="modal-close" onClick={() => setAccessOpen(false)} aria-label="Close access information"><X size={18} /></button>
            <span className="eyebrow">Portal access</span>
            <h2 id="modal-title">A welcome, not a dead end.</h2>
            <p id="modal-description">The member portal's sign-in and registration are not connected to this introduction page. Your church leadership will share access details when they are available for your community.</p>
            <div className="modal-note"><ShieldCheck size={17} /> For now, no information is collected here and no account is created. This page is here to help you understand what the portal is for.</div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
