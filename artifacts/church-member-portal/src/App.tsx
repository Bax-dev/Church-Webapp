import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Cross, Heart, Menu, Plus, ShieldCheck, Users, X } from 'lucide-react';
import gatheringImage from './assets/community-gathering.png';

const questions = [
  {
    question: 'What is Presbyterian Centre?',
    answer:
      'Presbyterian Centre is an introduction to a member portal designed to help members manage their profile and church connections, while administrators organise community information.',
  },
  {
    question: 'Can I create an account here?',
    answer:
      'No. This is a public introduction page only. Registration, sign-in and all other account flows are not connected here.',
  },
  {
    question: 'Who can see my information?',
    answer:
      'In the planned portal, members can view and edit only their own information, while super administrators can manage all member information. These access controls are planned and are not live on this public page.',
  },
  {
    question: 'What if my details change?',
    answer:
      'The planned member experience includes profile updates, with verification for email changes. Profile management is not connected on this page.',
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
          <a className="brand" href="#top" aria-label="Presbyterian Centre, home" onClick={closeMenu}>
            <BrandMark />
            <span>
              <span className="brand-name">Presbyterian Centre</span>
              <span className="brand-caption">Lekki, Lagos</span>
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
              <div className="hero-label eyebrow">Presbyterian Centre · Lekki</div>
              <h1 id="hero-title">People first.<br /><em>Connection</em> made clearer.</h1>
              <p className="hero-intro">
                An introduction to a member portal designed to bring profiles, departments and districts into clearer view for the Presbyterian Centre community.
              </p>
              <div className="hero-actions">
                <button className="button-primary" onClick={openAccess}>Find out about access <ArrowRight size={16} /></button>
                <a className="button-secondary" href="#the-portal">Get to know the portal <ArrowDown size={15} /></a>
              </div>
              <p className="hero-note">A thoughtful home for member details, departments and districts.</p>
            </div>
            <div className="hero-art">
              <div className="hero-art-frame">
                <img src={gatheringImage} alt="Illustrative image of people gathered around a table; not a photograph of Presbyterian Centre." />
                <div className="art-caption"><small>Illustrative community image</small>A clearer home for member connections.</div>
              </div>
              <div className="floating-note" aria-label="A little less admin, a little more care">
                <strong>A little less admin.<br />A little more care.</strong>
                <span>Connection, made simpler.</span>
              </div>
              <div className="hero-stamp"><span>Presbyterian<br />Centre</span></div>
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
              <span className="eyebrow">A clearer picture of the community</span>
              <h2 id="why-title">Member details and church connections, in one place.</h2>
              <p>The portal is designed to support member profiles and help administrators understand the community through organised records and useful summaries.</p>
            </div>
            <div className="why-list">
              <article className="why-item">
                <span className="why-number">01</span>
                <div><h3>Member profiles</h3><p>Members can manage their profile details, with email changes subject to verification.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">02</span>
                <div><h3>Departments and districts</h3><p>Member records can reflect the department and district each person belongs to.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">03</span>
                <div><h3>Useful administration</h3><p>Administrators can review member records, manage groups and find upcoming birthdays.</p></div>
              </article>
              <article className="why-item">
                <span className="why-number">04</span>
                <div><h3>Clearer oversight</h3><p>Administrative views include reports, filtered exports and an audit history.</p></div>
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
                  <p>The portal is planned around two distinct needs: members managing their own details and super administrators overseeing member and group records.</p>
              </div>
            </div>
            <div className="pathways-grid">
              <article className="pathway-card members">
                <span className="card-note">For members</span>
                <span className="card-icon"><Heart size={19} strokeWidth={1.7} /></span>
                <div>
                  <h3>Your profile and connections.</h3>
                  <p>The planned member experience brings together verified registration, sign-in and password tools, profile updates with optional photos, verified email changes and account deletion requests.</p>
                  <button className="pathway-link" onClick={openAccess}>About the member portal <ArrowRight size={15} /></button>
                </div>
              </article>
              <article className="pathway-card leaders">
                <span className="card-note">For super administrators</span>
                <span className="card-icon"><Users size={19} strokeWidth={1.7} /></span>
                <div>
                  <h3>A more organised administrative view.</h3>
                  <p>Super administrators are planned to review community summaries and birthdays, manage members and groups, explore reports and audit history, export filtered lists, and oversee approval settings and other administrators.</p>
                  <button className="pathway-link" onClick={openAccess}>About administration <ArrowRight size={15} /></button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section experience" aria-labelledby="experience-title">
          <div className="container experience-layout">
            <div className="experience-art">
              <img src={gatheringImage} alt="Illustrative image of a community gathering; not a photograph of the Centre." loading="lazy" />
            </div>
            <div className="experience-copy">
              <span className="eyebrow">Designed for members and administrators</span>
              <h2 id="experience-title">The essentials, thoughtfully organised.</h2>
              <p>The planned portal brings together the practical tasks members and super administrators need to manage community records.</p>
              <ul className="feature-list">
                <li><Check size={17} /><span>Verified registration, sign-in and password recovery or change</span></li>
                <li><Check size={17} /><span>Profile updates, optional photos, verified email changes and deletion requests</span></li>
                <li><Check size={17} /><span>Department and district records with administrator summaries and upcoming birthdays</span></li>
                <li><Check size={17} /><span>Member search, reports, audit history and filtered CSV, Excel or PDF exports</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section values" id="our-values" aria-labelledby="values-title">
          <div className="container values-inner">
            <div>
              <span className="eyebrow">A considered approach to member information</span>
              <h2 id="values-title">Technology<br />in its right place.</h2>
              <p className="values-intro">The portal is intended to make membership information easier to maintain and review, while keeping account functions separate from this public introduction.</p>
            </div>
            <div className="values-words">
              <div className="value"><strong>Member-led</strong><span>Designed for members to maintain their own profile details.</span></div>
              <div className="value"><strong>Verified</strong><span>Email verification is part of registration and email-change flows.</span></div>
              <div className="value"><strong>Organised</strong><span>Departments and districts help structure member records.</span></div>
              <div className="value"><strong>Accountable</strong><span>Administrator tools are planned to include reports and audit history.</span></div>
            </div>
          </div>
        </section>

        <section className="access" aria-labelledby="access-title">
          <div className="container access-card">
            <div>
              <span className="eyebrow">About this page</span>
              <h2 id="access-title">An introduction, not an account portal.</h2>
              <p>Presbyterian Centre’s member portal account flows are not connected here. This page does not register members, sign anyone in or collect account information.</p>
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
              <span className="eyebrow">Presbyterian Centre · Lekki</span>
              <h2 id="faq-title">A few things you may be wondering.</h2>
              <p>Find out what this introduction covers, and what is not available from this page.</p>
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
              <a className="brand" href="#top" aria-label="Presbyterian Centre, home">
                <BrandMark />
                <span><span className="brand-name">Presbyterian Centre</span><span className="brand-caption">Lekki, Lagos</span></span>
              </a>
              <p className="footer-copy">An introduction to the planned member portal for Presbyterian Centre.</p>
              <p className="footer-copy footer-location">Lekki–Epe Expressway, Lekki</p>
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
            <span>Presbyterian Centre · Lekki–Epe Expressway, Lekki</span>
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
            <p id="modal-description">Registration, sign-in and other member-account actions are not connected to this introduction page. This page is informational only.</p>
            <div className="modal-note"><ShieldCheck size={17} /> For now, no information is collected here and no account is created. This page is here to help you understand what the portal is for.</div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
