/**
 * Every piece of text and every image on the public website, section by section.
 *
 * - `contentDefaults` is what the site shows until a Super Admin edits it at /admin/content.
 * - `contentForm` describes each field for that editor (labels, limits, which fields are lists or images).
 * - Saved edits live in the settings table under "content" and are merged over the defaults, field by field,
 *   so a section added here later simply shows its default until someone edits it.
 *
 * Text can use {church}, {street}, {locality} and {region}; they are filled in from "Church details",
 * so renaming the church or changing its address updates every page. Titles marked `rich` also accept
 * *asterisks* for italic and a new line for a line break.
 */
import { imageKeys, images, type ImageKey } from './images'

export type ImageValue = { src: string; alt: string }

/** Uploaded images are served from here; bundled ones are written `asset:<key>`. */
export const SITE_IMAGE_ROUTE = '/api/site-images'
const UPLOAD_SRC = new RegExp(`^${SITE_IMAGE_ROUTE}/[0-9a-f]{16}\\.(jpg|png)$`)

export const assetSrc = (key: ImageKey) => `asset:${key}`
export const assetKey = (src: string) => (src.startsWith('asset:') && imageKeys.includes(src.slice(6) as ImageKey) ? (src.slice(6) as ImageKey) : undefined)
export const isUploadSrc = (src: string) => UPLOAD_SRC.test(src)
export const isImageSrc = (src: string) => Boolean(assetKey(src)) || isUploadSrc(src)

const img = (key: ImageKey, alt: string = images[key].alt): ImageValue => ({ src: assetSrc(key), alt })

/** Icons a card can use. The component that draws them is src/components/content.tsx. */
export const iconNames = ['sparkles', 'music', 'book', 'users', 'baby', 'hand-heart', 'heart', 'coffee', 'user-plus', 'shield', 'church', 'calendar', 'map-pin', 'star'] as const
export type IconName = (typeof iconNames)[number]

export const contentTokens = ['church', 'street', 'locality', 'region'] as const

export const contentDefaults = {
  site: {
    identity: {
      name: 'Presbyterian Centre',
      caption: 'Lekki, Lagos',
      logo: img('logo'),
      description: 'Presbyterian Centre is a church family on the Lekki–Epe Expressway, Lekki, Lagos. Join us to worship God, grow in His Word and serve one another.',
    },
    address: {
      street: 'Lekki–Epe Expressway',
      locality: 'Lekki',
      region: 'Lagos',
    },
    header: {
      ctaLabel: 'Plan a visit',
    },
    footer: {
      tagline: 'A community gathered to worship God, grow in His Word and serve one another.',
      location: '{street}, {locality}',
    },
    popup: {
      eyebrow: 'Announcement',
      closeLabel: 'Close',
      laterLabel: 'Remind me later',
    },
  },

  home: {
    hero: {
      eyebrow: '{church} · {locality}',
      title: 'A home for faith.\n*A family* to belong to.',
      intro: 'Welcome to {church}, {locality} — a community gathered to worship God, grow in His Word and care for one another and the city around us.',
      primaryLabel: 'Plan your visit',
      secondaryLabel: 'Get to know us',
      note: '{street}, {locality} · All are welcome.',
    },
    heroArt: {
      image: img('gathering'),
      captionLabel: 'Illustrative community image',
      caption: 'Gathered together in faith.',
      noteTitle: 'Come as you are.\nLeave encouraged.',
      noteText: 'You belong here.',
      stamp: 'Presbyterian\nCentre',
    },
    marquee: {
      words: ['Worship', 'Fellowship', 'Service'],
    },
    scripture: {
      image: img('worship'),
      quote: '“They devoted themselves to the apostles’ teaching and to fellowship, to the breaking of bread and to prayer.”',
      citation: 'Acts 2:42',
    },
    pastors: {
      show: true,
      eyebrow: 'Our pastors',
      title: 'Meet the shepherds\nwho serve *with you.*',
      text: 'Our pastors lead us in worship, teach the Word and walk alongside the congregation. Do say hello after a service.',
      linkLabel: 'More about our pastors',
    },
    gallery: {
      eyebrow: 'Life together',
      title: 'Worship, fellowship\nand service.',
      tiles: [{ image: img('worship') }, { image: img('youth') }, { image: img('outreach') }, { image: img('choir') }, { image: img('sunday-school') }],
      note: 'Images on this site are illustrations, not photographs of the Centre or its members.',
      linkLabel: 'See the full gallery',
    },
  },

  about: {
    intro: {
      image: img('worship'),
      eyebrow: 'About us',
      title: 'Rooted in faith.\n*Growing* together.',
      text: '{church} is a congregation in {locality} seeking to love God, follow Jesus Christ and serve our neighbours together.',
    },
    story: {
      image: img('bible-study'),
      eyebrow: 'Our heritage',
      title: 'Part of a long\nPresbyterian story.',
      paragraphs: [
        'Presbyterian churches trace their roots to the Reformation, with a deep love for Scripture, for God’s grace, and for a church shared and led together. In Nigeria, that story began in 1846 when missionaries from Scotland arrived in Calabar, and it has grown into congregations across the country.',
        '{church} carries that story into {locality} today: a congregation that worships, studies and serves together.',
      ],
      points: [
        { title: 'Led by elders', text: 'Ministers and elected elders share the leadership and pastoral care of the congregation.' },
        { title: 'Rooted in the Word', text: 'Preaching and teaching from the Bible shape everything we do.' },
        { title: 'Connected', text: 'Departments and districts make a large church feel like a family.' },
      ],
    },
    pastors: {
      show: true,
      eyebrow: 'Our pastors',
      title: 'Shepherds who serve *with you.*',
      text: 'Our pastors lead us in worship, teach the Word and walk alongside the congregation. Do say hello after a service.',
    },
    scripture: {
      image: img('choir'),
      quote: '“They devoted themselves to the apostles’ teaching and to fellowship, to the breaking of bread and to prayer.”',
      citation: 'Acts 2:42',
    },
    beliefs: {
      eyebrow: 'What we believe',
      title: 'Grace at the centre\nof everything.',
      text: 'As a Presbyterian church, we hold to the historic Christian faith as expressed in the Reformed tradition.',
      items: [
        { title: 'Grace', text: 'Salvation is God’s gift, received through faith in Jesus Christ.' },
        { title: 'Scripture', text: 'The Bible is the Word of God and our guide for faith and life.' },
        { title: 'Community', text: 'We are called to belong to one another as the family of God.' },
        { title: 'Service', text: 'Our faith is lived out in love for our neighbours.' },
      ],
    },
  },

  visit: {
    intro: {
      image: img('choir'),
      eyebrow: 'Plan your visit',
      title: 'Come as you are.\n*You* are welcome.',
      text: 'Find us on the {street}, {locality}, {region}.',
    },
    expect: {
      image: img('gathering', 'Illustrative image of a community gathering; not a photograph of the Centre.'),
      eyebrow: 'What to expect',
      title: 'Join us for worship.',
      text: '{church} is on the {street}, {locality}, {region}. Whoever you are and wherever you are on your journey, you are welcome.',
      points: [
        'Come as you are, there is no dress code to worry about',
        'Expect prayer, singing and the preaching of God’s Word',
        'Stay after the service to meet members of the congregation',
        'Ask anyone you meet about joining a department or district',
      ],
    },
    firstSunday: {
      image: img('sunday-school'),
      eyebrow: 'Your first Sunday',
      title: 'What happens\nwhen you visit.',
      moments: [
        { title: 'Arrive a little early', text: 'Ushers at the door will welcome you and help you find a seat. Families with young children are very welcome.' },
        { title: 'Worship together', text: 'The service includes hymns and songs, prayers, Bible readings and a sermon. Join in as much or as little as you like.' },
        { title: 'Bring the children', text: 'Children are welcome in worship. Ask an usher about children’s activities on the day.' },
        { title: 'Stay and meet people', text: 'After the service, stay and chat. Let someone know you are new and we will be glad to introduce you.' },
      ],
    },
    gettingHere: {
      eyebrow: 'Getting here',
      title: 'Find us in {locality}.',
      addressLabel: 'Address',
      travelLabel: 'Travel',
      travelTitle: 'Allow extra time for traffic',
      travelText: 'The expressway can be busy, especially on Sunday mornings.',
      timesLabel: 'Service times',
      timesTitle: 'Ask us before your visit',
      timesText: 'Check our latest announcement, or ask any member.',
      mapsLabel: 'Open in Google Maps',
      faqLabel: 'Read common questions',
    },
  },

  getInvolved: {
    intro: {
      image: img('outreach'),
      eyebrow: 'Get involved',
      title: 'There is a place\nfor *you* here.',
      text: 'From your first visit to serving in a department or district, find your way into the life of the church.',
    },
    steps: {
      eyebrow: 'Your next step',
      title: 'How to become\npart of the family.',
      items: [
        { icon: 'coffee', title: 'Visit on a Sunday', text: 'Worship with us and stay afterwards to meet people. No need to sign up first.' },
        { icon: 'user-plus', title: 'Say hello', text: 'Tell an usher or elder you are new. They will introduce you and answer your questions.' },
        { icon: 'users', title: 'Find your people', text: 'Join the district near your home and a department where you can grow and serve.' },
        { icon: 'hand-heart', title: 'Serve together', text: 'Use your gifts in worship, care, outreach and teaching, alongside others.' },
      ],
    },
  },

  faqs: {
    intro: {
      image: img('bible-study'),
      eyebrow: 'FAQs',
      title: 'A few things you\nmay be *wondering.*',
      text: 'Some answers for first-time visitors and members alike.',
    },
    list: {
      items: [
        { question: 'Who is welcome at {church}?', answer: 'Everyone. Whether you are new to faith, returning after time away, or looking for a church family in {locality}, you are welcome to join us.' },
        { question: 'Where can I find you?', answer: '{church} is on the {street}, {locality}, {region}.' },
        { question: 'What should I expect when I visit?', answer: 'Come as you are. Our worship centres on prayer, singing, the reading and preaching of Scripture, and fellowship with one another.' },
        { question: 'Do I need to be Presbyterian to attend?', answer: 'No. Christians from every tradition, and people who are simply curious about faith, are welcome to worship with us.' },
        { question: 'Can I bring my children?', answer: 'Yes, families are very welcome. Ask an usher on arrival about children’s activities on the day.' },
        { question: 'How do I join a department or district?', answer: 'Speak to an usher or elder after the service and they will connect you. Districts are based on where you live; departments are based on how you would like to serve.' },
        { question: 'What does the church do with my personal details?', answer: 'Member details are used only to organise church life and keep in touch, in line with the Nigeria Data Protection Act 2023. You can ask to see, correct or delete them at any time.' },
        { question: 'I am already a member. Where is the member portal?', answer: 'Use the Member login link at the top of any page. New members can create an account from there with just a name and email address, then add their details, department and district from their dashboard.' },
      ],
    },
  },

  gallery: {
    intro: {
      image: img('choir'),
      eyebrow: 'Gallery',
      title: 'Moments from\n*life together.*',
      text: 'Worship, fellowship, service and celebration at {church}, {locality}.',
    },
    albums: {
      note: 'Images on this site are illustrations, not photographs of the Centre or its members.',
      items: [
        {
          title: 'Sunday worship',
          text: 'The whole church family gathered to praise God, pray and hear His Word.',
          photos: [{ image: img('worship'), caption: 'Standing to sing together' }, { image: img('choir'), caption: 'The choir leading the hymns' }],
        },
        {
          title: 'Fellowship',
          text: 'Districts, departments and friendships that carry on beyond Sunday.',
          photos: [{ image: img('gathering'), caption: 'Greeting one another after the service' }, { image: img('bible-study'), caption: 'A district Bible study' }, { image: img('youth'), caption: 'Youth fellowship' }],
        },
        {
          title: 'Children and outreach',
          text: 'Teaching our youngest members, and serving our neighbours across {locality}.',
          photos: [{ image: img('sunday-school'), caption: 'Sunday school' }, { image: img('outreach'), caption: 'Outreach in the community' }],
        },
      ],
    },
    pastors: {
      show: true,
      eyebrow: 'Our pastors',
      title: 'The faces you will\nsee *on Sunday.*',
      text: 'Our pastors lead worship, preach and care for the congregation. Do come and say hello.',
      linkLabel: 'More about our pastors',
    },
  },

  members: {
    intro: {
      image: img('youth'),
      eyebrow: 'Member hub',
      title: 'A place to belong.\n*A family* to grow with.',
      text: 'Being part of {church} means worshipping, serving and caring for one another together. Find a next step, or sign in to the member portal.',
    },
    features: {
      eyebrow: 'Life together',
      title: 'Stay connected\nto your church family.',
      text: 'Whether you are new to the congregation or have been here for years, there is a next step for you.',
      items: [
        { icon: 'users', title: 'Find your place', text: 'Connect with a department or district and discover ways to grow and serve alongside others.' },
        { icon: 'heart', title: 'Keep your details current', text: 'The member portal lets you review and update your own contact and profile details, department and district.' },
        { icon: 'shield', title: 'Your information, handled with care', text: 'Only you and the church administrators can see your record, and you can ask to see, correct or delete it at any time.' },
      ],
    },
    districts: {
      image: img('gathering'),
      eyebrow: 'Districts',
      title: 'Fellowship close\nto home.',
      paragraphs: [
        'Every member belongs to a district: a smaller group of members who live in the same part of {locality} and beyond. Districts meet to study the Bible and pray, and they are often the first to know when someone needs a visit, a meal or a phone call.',
        'Departments bring members together around a shared way of serving, from the choir to ushering to outreach.',
      ],
      linkLabel: 'See how to get involved',
    },
    portal: {
      eyebrow: 'Member portal',
      guestTitle: 'Keep your details up to date.',
      guestText: 'Create an account with your name and email address, then add your contact details, birthday, department and district from your dashboard.',
      loginLabel: 'Member login',
      signupLabel: 'Create an account',
      memberTitle: 'Welcome back, {name}.',
      memberText: 'Check your details are up to date, or update your department and district.',
      editLabel: 'Update my details',
    },
  },

  shared: {
    pillars: {
      eyebrow: 'Who we are',
      title: 'A Presbyterian church family in the heart of {locality}.',
      text: 'We are a congregation rooted in the Reformed tradition, seeking to love God, follow Jesus Christ and serve our neighbours together.',
      linkLabel: 'More about us',
      items: [
        { title: 'Worship', text: 'We gather to praise God, pray together and celebrate the sacraments as one body.' },
        { title: 'The Word', text: 'Scripture shapes our life together, through preaching, teaching and study.' },
        { title: 'Fellowship', text: 'Through departments and districts, members know one another and share life beyond Sunday.' },
        { title: 'Service', text: 'We seek to reflect Christ’s love in {locality}, {region} and beyond through care and outreach.' },
      ],
    },
    ministries: {
      eyebrow: 'Church life',
      title: 'Something for\nevery season of life.',
      text: 'From Sunday worship to midweek fellowship, there are many ways to belong at {church}.',
      buttonLabel: 'All the ways to get involved',
      items: [
        { icon: 'sparkles', image: img('worship'), title: 'Sunday worship', text: 'Prayer, hymns and the preaching of the Word, with the whole church family gathered together.' },
        { icon: 'music', image: img('choir'), title: 'Choir & music', text: 'Lead the congregation in song and grow in faith with others who love to sing.' },
        { icon: 'book', image: img('bible-study'), title: 'Districts & Bible study', text: 'Meet with members who live near you to study Scripture, pray and look out for one another.' },
        { icon: 'users', image: img('youth'), title: 'Youth fellowship', text: 'A place for teenagers and young adults to ask big questions and build lasting friendships.' },
        { icon: 'baby', image: img('sunday-school'), title: 'Children’s ministry', text: 'Bible stories, songs and care for our youngest members while their parents worship.' },
        { icon: 'hand-heart', image: img('outreach'), title: 'Outreach & care', text: 'Serve neighbours across {locality} and beyond with practical help and Christ’s love.' },
      ],
    },
    pathways: {
      eyebrow: 'Get involved',
      title: 'Many members.\nOne body.',
      text: 'Whether you are visiting for the first time or have worshipped with us for years, there is a place for you at {church}.',
      newcomerNote: 'New here',
      newcomerTitle: 'We would love to meet you.',
      newcomerText: 'Join us for worship and come as you are. Our congregation will be glad to welcome you, answer your questions and help you find your way.',
      newcomerLink: 'Plan your visit',
      memberNote: 'Members',
      memberTitle: 'Serve, grow and stay connected.',
      memberText: 'Find your place in a department or district, serve alongside others and grow in fellowship. Sign in to the member portal to keep your details up to date.',
      memberLink: 'Explore the member hub',
    },
    cta: {
      eyebrow: 'You are welcome here',
      title: 'Come and worship with us.',
      text: 'Whoever you are and wherever you are on your journey, there is a place for you at {church}.',
      buttonLabel: 'Plan your visit',
    },
  },


  navigation: {
    header: {
      about: 'About us', getInvolved: 'Get involved', members: 'Member hub', gallery: 'Gallery', visit: 'Visit', faqs: 'FAQs', prayer: 'Prayer',
      login: 'Member login', dashboard: 'My dashboard', admin: 'Admin', signOut: 'Sign out',
    },
    footer: {
      exploreTitle: 'Explore', about: 'About us', getInvolved: 'Get involved', members: 'Member hub', gallery: 'Gallery',
      membersTitle: 'Members', signIn: 'Sign in', signup: 'Create an account', dashboard: 'My dashboard', profile: 'My profile', settings: 'Account settings', admin: 'Admin',
      nextTitle: 'Next step', visit: 'Plan a visit', faqs: 'Common questions',
      backToTop: 'Back to the top',
    },
  },

  seo: {
    home: { title: '{church}, {locality} — Worship, Fellowship, Service' },
    about: { title: 'About us', description: 'Who we are and what we believe: a Presbyterian congregation in {locality} rooted in the Reformed tradition, gathered around worship, the Word, fellowship and service.' },
    getInvolved: { title: 'Get involved', description: 'Whether you are visiting for the first time or have worshipped with us for years, there is a place for you at {church}.' },
    members: { title: 'Member hub', description: 'Find ways to belong, serve and stay connected at {church}, and sign in to the member portal.' },
    gallery: { title: 'Gallery', description: 'Photos of worship, fellowship and service at {church}, {locality}.' },
    visit: { title: 'Plan your visit', description: 'Join us for worship at {church} on the {street}, {locality}. Come as you are — you are welcome.' },
    faqs: { title: 'FAQs', description: 'Answers for first-time visitors and members of {church}, {locality}.' },
  },

  auth: {
    login: { eyebrow: 'Member portal', title: 'Welcome *back.*', text: 'Sign in to view and update the details the church holds about you.' },
    signup: { eyebrow: 'Member portal', title: 'Join the *family* record.', text: 'Tell us your name and email address. We will email you a link to set your password, and you can add the rest of your details from your dashboard.' },
    setPassword: { eyebrow: 'Last step', title: 'Choose your *password.*', text: 'Your email address is confirmed once you set a password. Then your account is ready, or ready for the church office to approve.' },
    forgotPassword: { eyebrow: 'Account help', title: 'Forgot your *password?*', text: 'Enter the email address you signed up with and we will send you a link to choose a new one.' },
    resetPassword: { eyebrow: 'Account help', title: 'Choose a new *password.*', text: 'Reset links work once and expire after an hour. Setting a new password signs you out on your other devices.' },
    benefits: {
      items: ['Keep your contact details and address up to date', 'Choose your department and district', 'Make sure the church never misses your birthday'],
    },
  },

  portal: {
    dashboard: {
      eyebrow: 'Member dashboard',
      title: 'Welcome, {name}.',
      incompleteText: 'Your record is not complete yet. Adding your details helps the church care for you well.',
      completeText: 'Here is what the church has on record for you. Keeping it current helps us care for you well.',
      recordTitle: 'Your record',
      familyTitle: 'Your church family',
      quickLinksTitle: 'Quick links',
    },
    profile: { eyebrow: 'My profile', title: 'Your details', text: 'Only you and the church administrators can see this information.' },
    profileEdit: { eyebrow: 'My profile', title: 'Edit your details', text: 'Your role and account status are managed by the church office.' },
    settings: {
      eyebrow: 'Settings',
      title: 'Account settings',
      dataText: 'You can ask for a copy of your details, a correction, or for your account and personal data to be deleted, as the Nigeria Data Protection Act 2023 allows.',
    },
  },

  prayerPage: {
    labels: {
      liveNow: 'Live now',
      hostPrefix: 'with',
      youtubeButton: 'Watch on YouTube',
      zoomButton: 'Join on Zoom',
      zoomIdLabel: 'Zoom meeting ID',
      passcodeLabel: 'Passcode',
      tonightTheme: 'Tonight’s theme',
      themeFor: 'Theme for {date}',
      readGuide: 'Read the prayer guide',
      moreAbout: 'More about {title}',
      notToday: 'Today’s guide is not up yet. Here is the most recent one.',
      emptyTitle: 'The prayer guide will be posted here',
      emptyDateTitle: 'No prayer guide for {date}',
      emptyText: 'Join us online at the time above, and check back for the daily prayer guide.',
      recentTitle: 'Recent guides',
      backToToday: 'Back to today’s guide',
    },
    guide: {
      focus: 'Focus',
      exposition: 'Exposition',
      prayers: 'Let us pray',
      declarations: 'Corporate declarations',
      finalPrayer: 'Final prayer',
    },
  },
  notFound: {
    page: {
      eyebrow: 'Page not found',
      title: 'This page is not here.',
      text: 'The page you were looking for may have moved.',
      buttonLabel: 'Back to home',
    },
  },
}

export type SiteContent = typeof contentDefaults
export type ContentGroup = keyof SiteContent

// ---------------------------------------------------------------------------------------------
// Field descriptions for the editor. The types tie each description to the shape of its default,
// so a field cannot be forgotten or described as the wrong kind.

export type TextField = { type: 'text'; label: string; hint?: string; max?: number; multiline?: boolean; rich?: boolean; optional?: boolean }
export type IconField = { type: 'icon'; label: string }
export type ToggleField = { type: 'toggle'; label: string; hint?: string }
export type ImageField = { type: 'image'; label: string; hint?: string }
export type StringsField = { type: 'strings'; label: string; itemLabel: string; min?: number; max: number; multiline?: boolean; maxLength?: number }
export type ListField<I = unknown> = { type: 'list'; label: string; itemLabel: string; min?: number; max: number; fields: FieldsOf<I> }
export type AnyField = TextField | IconField | ToggleField | ImageField | StringsField | ListField

// [V] stops boolean (true | false) from being split into two cases.
type FieldFor<V> = [V] extends [boolean] ? ToggleField : V extends ImageValue ? ImageField : V extends string ? TextField | IconField : V extends string[] ? StringsField : V extends (infer I)[] ? ListField<I> : never
export type FieldsOf<T> = { [K in keyof T]: FieldFor<T[K]> }
export type SectionForm<T> = { label: string; hint?: string; fields: FieldsOf<T> }
export type GroupForm<T> = { label: string; path?: string; hint?: string; sections: { [S in keyof T]: SectionForm<T[S]> } }

const t = (label: string, extra: Omit<TextField, 'type' | 'label'> = {}): TextField => ({ type: 'text', label, max: 200, ...extra })
const title = (label = 'Title') => t(label, { rich: true, multiline: true, max: 120 })
const para = (label: string, extra: Omit<TextField, 'type' | 'label'> = {}) => t(label, { multiline: true, max: 600, ...extra })
const image = (label = 'Image', hint?: string): ImageField => ({ type: 'image', label, hint })
const icon = (label = 'Icon'): IconField => ({ type: 'icon', label })
const toggle = (label: string, hint?: string): ToggleField => ({ type: 'toggle', label, hint })

/** The pastors section's heading; the pastors themselves come from Admin → Pastors. With a link, it points to the full list on About. */
const pastorsFields = {
  show: toggle('Show this section', 'The section also stays hidden while no pastors have been added under Admin → Pastors.'),
  eyebrow: t('Small heading'), title: title(), text: para('Introduction'),
}
const pastorsHint = 'Shows the pastors from Admin → Pastors, in the order set there.'
const pastorsWithLink = { ...pastorsFields, linkLabel: t('Link to the About page', { optional: true, max: 60, hint: 'Leave empty for no link.' }) }
const intro = { image: image('Background photo'), eyebrow: t('Small heading'), title: title(), text: para('Introduction') }

export const contentForm: { [G in ContentGroup]: GroupForm<SiteContent[G]> } = {
  site: {
    label: 'Church details',
    hint: 'Name, address, logo, header and footer. The name and address fill in {church}, {street}, {locality} and {region} on every page.',
    sections: {
      identity: {
        label: 'Name and logo',
        fields: {
          name: t('Church name', { max: 80 }),
          caption: t('Caption under the name', { max: 60 }),
          logo: image('Logo', 'Shown in the header and footer. A wide or square emblem works best.'),
          description: para('Short description for search engines and link previews', { max: 300 }),
        },
      },
      address: {
        label: 'Address',
        fields: { street: t('Street', { max: 120 }), locality: t('Area or town', { max: 80 }), region: t('State', { max: 80 }) },
      },
      header: { label: 'Header', fields: { ctaLabel: t('Button for visitors (signed-out)', { max: 40 }) } },
      footer: { label: 'Footer', fields: { tagline: para('Tagline', { max: 200 }), location: t('Location line', { max: 160 }) } },
      popup: {
        label: 'Announcement popup buttons',
        hint: 'The announcement itself is written under Admin → Announcements.',
        fields: { eyebrow: t('Small heading', { max: 30 }), closeLabel: t('Close button', { max: 30 }), laterLabel: t('“Not now” link', { max: 40 }) },
      },
    },
  },

  home: {
    label: 'Home',
    path: '/',
    sections: {
      hero: {
        label: 'Top of the page',
        fields: {
          eyebrow: t('Small heading'), title: title('Main heading'), intro: para('Introduction'),
          primaryLabel: t('Main button (goes to Plan your visit)', { max: 40 }), secondaryLabel: t('Second button (scrolls down)', { max: 40 }),
          note: t('Note under the buttons'),
        },
      },
      heroArt: {
        label: 'Photo beside the heading',
        fields: {
          image: image('Photo'), captionLabel: t('Caption label', { optional: true, max: 60 }), caption: t('Caption', { optional: true, max: 80 }),
          noteTitle: t('Floating note heading', { multiline: true, max: 80 }), noteText: t('Floating note text', { optional: true, max: 60 }),
          stamp: t('Round stamp text', { multiline: true, max: 40 }),
        },
      },
      marquee: { label: 'Words band', fields: { words: { type: 'strings', label: 'Words', itemLabel: 'Word', min: 1, max: 6, maxLength: 30 } } },
      scripture: { label: 'Scripture band', fields: { image: image('Background photo'), quote: para('Verse', { max: 400 }), citation: t('Reference', { max: 60 }) } },
      pastors: { label: 'Our pastors', hint: pastorsHint, fields: pastorsWithLink },
      gallery: {
        label: 'Photo gallery',
        fields: {
          eyebrow: t('Small heading'), title: title(),
          tiles: { type: 'list', label: 'Photos', itemLabel: 'Photo', min: 1, max: 5, fields: { image: image('Photo') } },
          note: t('Note under the photos', { optional: true, max: 200 }),
          linkLabel: t('Link to the gallery page (leave empty to hide)', { optional: true, max: 40 }),
        },
      },
    },
  },

  about: {
    label: 'About us',
    path: '/about',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      story: {
        label: 'Our heritage',
        fields: {
          image: image('Photo'), eyebrow: t('Small heading'), title: title(),
          paragraphs: { type: 'strings', label: 'Paragraphs', itemLabel: 'Paragraph', min: 1, max: 5, multiline: true, maxLength: 1000 },
          points: { type: 'list', label: 'Key points', itemLabel: 'Point', max: 6, fields: { title: t('Heading', { max: 60 }), text: para('Text', { max: 300 }) } },
        },
      },
      pastors: { label: 'Our pastors', hint: pastorsHint, fields: pastorsFields },
      scripture: { label: 'Scripture band', fields: { image: image('Background photo'), quote: para('Verse', { max: 400 }), citation: t('Reference', { max: 60 }) } },
      beliefs: {
        label: 'What we believe',
        fields: {
          eyebrow: t('Small heading'), title: title(), text: para('Introduction'),
          items: { type: 'list', label: 'Beliefs', itemLabel: 'Belief', min: 1, max: 8, fields: { title: t('Heading', { max: 40 }), text: para('Text', { max: 300 }) } },
        },
      },
    },
  },

  visit: {
    label: 'Plan your visit',
    path: '/visit',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      expect: {
        label: 'What to expect',
        fields: {
          image: image('Photo'), eyebrow: t('Small heading'), title: title(), text: para('Introduction'),
          points: { type: 'strings', label: 'Checklist', itemLabel: 'Item', max: 8, maxLength: 160 },
        },
      },
      firstSunday: {
        label: 'Your first Sunday',
        fields: {
          image: image('Photo'), eyebrow: t('Small heading'), title: title(),
          moments: { type: 'list', label: 'Steps', itemLabel: 'Step', min: 1, max: 8, fields: { title: t('Heading', { max: 60 }), text: para('Text', { max: 300 }) } },
        },
      },
      gettingHere: {
        label: 'Getting here',
        hint: 'The address comes from Church details.',
        fields: {
          eyebrow: t('Small heading'), title: title(),
          addressLabel: t('Address label', { max: 40 }),
          travelLabel: t('Travel label', { max: 40 }), travelTitle: t('Travel heading', { max: 80 }), travelText: para('Travel text', { max: 200 }),
          timesLabel: t('Service times label', { max: 40 }), timesTitle: t('Service times heading', { max: 80 }), timesText: para('Service times text', { max: 200 }),
          mapsLabel: t('Map button', { max: 40 }), faqLabel: t('FAQ link', { max: 40 }),
        },
      },
    },
  },

  getInvolved: {
    label: 'Get involved',
    path: '/get-involved',
    hint: 'The “Church life” cards and the “Many members” section on this page are under Shared sections.',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      steps: {
        label: 'Your next step',
        fields: {
          eyebrow: t('Small heading'), title: title(),
          items: { type: 'list', label: 'Steps', itemLabel: 'Step', min: 1, max: 6, fields: { icon: icon(), title: t('Heading', { max: 60 }), text: para('Text', { max: 300 }) } },
        },
      },
    },
  },

  faqs: {
    label: 'FAQs',
    path: '/faqs',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      list: {
        label: 'Questions',
        hint: 'Also published to search engines as an FAQ list.',
        fields: { items: { type: 'list', label: 'Questions', itemLabel: 'Question', min: 1, max: 30, fields: { question: t('Question', { max: 160 }), answer: para('Answer', { max: 1000 }) } } },
      },
    },
  },

  gallery: {
    label: 'Gallery',
    path: '/gallery',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      albums: {
        label: 'Albums',
        hint: 'Each album is a titled set of photos; the page links to every album from the top.',
        fields: {
          note: t('Note under the albums', { optional: true, max: 200 }),
          items: {
            type: 'list', label: 'Albums', itemLabel: 'Album', min: 1, max: 12,
            fields: {
              title: t('Album title', { max: 60 }), text: para('Description', { optional: true, max: 300 }),
              photos: { type: 'list', label: 'Photos', itemLabel: 'Photo', min: 1, max: 40, fields: { image: image('Photo'), caption: t('Caption', { optional: true, max: 120 }) } },
            },
          },
        },
      },
      pastors: { label: 'Our pastors', hint: pastorsHint, fields: pastorsWithLink },
    },
  },

  members: {
    label: 'Member hub',
    path: '/members',
    sections: {
      intro: { label: 'Top of the page', fields: intro },
      features: {
        label: 'Life together',
        fields: {
          eyebrow: t('Small heading'), title: title(), text: para('Introduction'),
          items: { type: 'list', label: 'Cards', itemLabel: 'Card', min: 1, max: 6, fields: { icon: icon(), title: t('Heading', { max: 60 }), text: para('Text', { max: 300 }) } },
        },
      },
      districts: {
        label: 'Districts',
        fields: {
          image: image('Photo'), eyebrow: t('Small heading'), title: title(),
          paragraphs: { type: 'strings', label: 'Paragraphs', itemLabel: 'Paragraph', min: 1, max: 4, multiline: true, maxLength: 1000 },
          linkLabel: t('Link (goes to Get involved)', { max: 60 }),
        },
      },
      portal: {
        label: 'Member portal box',
        hint: 'Visitors see the first set; signed-in members see the second. {name} is the member’s first name.',
        fields: {
          eyebrow: t('Small heading'),
          guestTitle: t('Heading for visitors', { max: 80 }), guestText: para('Text for visitors', { max: 300 }),
          loginLabel: t('Sign-in button', { max: 40 }), signupLabel: t('Create-account link', { max: 40 }),
          memberTitle: t('Heading for members', { max: 80 }), memberText: para('Text for members', { max: 300 }),
          editLabel: t('Edit-details link', { max: 40 }),
        },
      },
    },
  },

  shared: {
    label: 'Shared sections',
    hint: 'These sections appear on more than one page; a change here updates them everywhere.',
    sections: {
      pillars: {
        label: 'Who we are (Home, About)',
        fields: {
          eyebrow: t('Small heading'), title: title(), text: para('Introduction'), linkLabel: t('Link on the home page', { max: 40 }),
          items: { type: 'list', label: 'Pillars', itemLabel: 'Pillar', min: 1, max: 6, fields: { title: t('Heading', { max: 40 }), text: para('Text', { max: 300 }) } },
        },
      },
      ministries: {
        label: 'Church life cards (Home, Get involved)',
        fields: {
          eyebrow: t('Small heading'), title: title(), text: para('Introduction'), buttonLabel: t('Button on the home page', { max: 60 }),
          items: { type: 'list', label: 'Cards', itemLabel: 'Card', min: 1, max: 9, fields: { icon: icon(), image: image('Photo'), title: t('Heading', { max: 60 }), text: para('Text', { max: 300 }) } },
        },
      },
      pathways: {
        label: 'Many members, one body (Home, Get involved)',
        fields: {
          eyebrow: t('Small heading'), title: title(), text: para('Introduction'),
          newcomerNote: t('Newcomer card label', { max: 30 }), newcomerTitle: t('Newcomer card heading', { max: 80 }), newcomerText: para('Newcomer card text', { max: 300 }), newcomerLink: t('Newcomer card link', { max: 40 }),
          memberNote: t('Member card label', { max: 30 }), memberTitle: t('Member card heading', { max: 80 }), memberText: para('Member card text', { max: 300 }), memberLink: t('Member card link', { max: 40 }),
        },
      },
      cta: {
        label: 'Closing invitation (every page)',
        fields: { eyebrow: t('Small heading'), title: title(), text: para('Text'), buttonLabel: t('Button (goes to Plan your visit)', { max: 40 }) },
      },
    },
  },


  navigation: {
    label: 'Menus',
    hint: 'The wording of the header and footer links. Which links appear (and to whom) is fixed: visitors, members and admins each see the links that apply to them.',
    sections: {
      header: {
        label: 'Header',
        fields: {
          about: t('About us', { max: 30 }), getInvolved: t('Get involved', { max: 30 }), members: t('Member hub', { max: 30 }), gallery: t('Gallery', { max: 30 }),
          visit: t('Plan your visit', { max: 30 }), faqs: t('FAQs', { max: 30 }), prayer: t('Prayer (shown while the prayer programme is on)', { max: 30 }),
          login: t('Sign-in link (visitors)', { max: 30 }), dashboard: t('Account button (members)', { max: 30 }), admin: t('Account button (Super Admins)', { max: 30 }),
          signOut: t('Sign-out link', { max: 30 }),
        },
      },
      footer: {
        label: 'Footer',
        hint: 'The prayer link in the footer uses the programme title from Admin → Prayer programme.',
        fields: {
          exploreTitle: t('First column heading', { max: 30 }), about: t('About us', { max: 40 }), getInvolved: t('Get involved', { max: 40 }), members: t('Member hub', { max: 40 }), gallery: t('Gallery', { max: 40 }),
          membersTitle: t('Second column heading', { max: 30 }), signIn: t('Sign in (visitors)', { max: 40 }), signup: t('Create an account (visitors)', { max: 40 }),
          dashboard: t('My dashboard (members)', { max: 40 }), profile: t('My profile (members)', { max: 40 }), settings: t('Account settings (members)', { max: 40 }), admin: t('Admin (Super Admins)', { max: 40 }),
          nextTitle: t('Third column heading', { max: 30 }), visit: t('Plan a visit', { max: 40 }), faqs: t('Common questions', { max: 40 }),
          backToTop: t('Back-to-top link', { max: 40 }),
        },
      },
    },
  },

  seo: {
    label: 'Search & sharing',
    hint: 'What search engines and link previews (WhatsApp, Facebook) show for each page. Page titles get “— church name” added automatically.',
    sections: {
      home: { label: 'Home', hint: 'The home page description is the one under Church details.', fields: { title: t('Browser tab title', { max: 90 }) } },
      about: { label: 'About us', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
      getInvolved: { label: 'Get involved', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
      members: { label: 'Member hub', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
      gallery: { label: 'Gallery', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
      visit: { label: 'Plan your visit', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
      faqs: { label: 'FAQs', fields: { title: t('Page title', { max: 60 }), description: para('Description', { max: 300 }) } },
    },
  },

  auth: {
    label: 'Sign-in pages',
    hint: 'The left-hand side of the sign-in, sign-up and password pages. The forms themselves keep their standard wording.',
    sections: {
      login: { label: 'Sign in', fields: { eyebrow: t('Small heading'), title: title(), text: para('Introduction') } },
      signup: { label: 'Create an account', fields: { eyebrow: t('Small heading'), title: title(), text: para('Introduction') } },
      setPassword: { label: 'Set password (from the sign-up email)', fields: { eyebrow: t('Small heading'), title: title(), text: para('Introduction') } },
      forgotPassword: { label: 'Forgot password', fields: { eyebrow: t('Small heading'), title: title(), text: para('Introduction') } },
      resetPassword: { label: 'Reset password (from the reset email)', fields: { eyebrow: t('Small heading'), title: title(), text: para('Introduction') } },
      benefits: { label: 'Checklist on every sign-in page', fields: { items: { type: 'strings', label: 'Items', itemLabel: 'Item', max: 6, maxLength: 120 } } },
    },
  },

  portal: {
    label: 'Member portal',
    hint: 'Headings and introductions members see after signing in. {name} is the member’s first name.',
    sections: {
      dashboard: {
        label: 'Dashboard',
        fields: {
          eyebrow: t('Small heading'), title: t('Greeting', { max: 80 }),
          incompleteText: para('Introduction while the profile is incomplete', { max: 300 }), completeText: para('Introduction once the profile is complete', { max: 300 }),
          recordTitle: t('“Your record” panel heading', { max: 40 }), familyTitle: t('“Church family” panel heading', { max: 40 }), quickLinksTitle: t('“Quick links” panel heading', { max: 40 }),
        },
      },
      profile: { label: 'My profile', fields: { eyebrow: t('Small heading'), title: t('Heading', { max: 80 }), text: para('Introduction', { max: 300 }) } },
      profileEdit: { label: 'Edit profile', fields: { eyebrow: t('Small heading'), title: t('Heading', { max: 80 }), text: para('Introduction', { max: 300 }) } },
      settings: { label: 'Account settings', fields: { eyebrow: t('Small heading'), title: t('Heading', { max: 80 }), dataText: para('“Your data” text', { max: 400 }) } },
    },
  },

  prayerPage: {
    label: 'Prayer page wording',
    path: '/prayer',
    hint: 'Fixed wording around the prayer programme, on the Prayer page and the home page band. The programme itself (title, times, links, flyer, daily guides) is under Admin → Prayer programme. {date} and {title} are filled in for you.',
    sections: {
      labels: {
        label: 'Labels and messages',
        fields: {
          liveNow: t('Badge while live', { max: 30 }), hostPrefix: t('Word before the host’s name', { max: 20 }),
          youtubeButton: t('YouTube button (when no label is set in the programme)', { max: 40 }), zoomButton: t('Zoom button (when no label is set in the programme)', { max: 40 }),
          zoomIdLabel: t('Zoom meeting ID label', { max: 30 }), passcodeLabel: t('Passcode label', { max: 30 }),
          tonightTheme: t('Theme label while live', { max: 40 }), themeFor: t('Theme label for another day', { max: 40 }),
          readGuide: t('Home band link when there is a guide', { max: 40 }), moreAbout: t('Home band link when there is no guide', { max: 60 }),
          notToday: para('Note when today’s guide is not up yet', { max: 200 }),
          emptyTitle: t('Heading when there is no guide yet', { max: 80 }), emptyDateTitle: t('Heading when a date has no guide', { max: 80 }), emptyText: para('Text when there is no guide', { max: 300 }),
          recentTitle: t('Recent guides heading', { max: 40 }), backToToday: t('Back-to-today link', { max: 40 }),
        },
      },
      guide: {
        label: 'Prayer guide headings',
        fields: {
          focus: t('Focus', { max: 40 }), exposition: t('Exposition', { max: 40 }), prayers: t('Prayer points', { max: 40 }),
          declarations: t('Declarations', { max: 40 }), finalPrayer: t('Final prayer', { max: 40 }),
        },
      },
    },
  },
  notFound: {
    label: 'Page not found',
    sections: {
      page: { label: 'Page not found (404)', fields: { eyebrow: t('Small heading'), title: title(), text: para('Text'), buttonLabel: t('Button', { max: 40 }) } },
    },
  },
}

export const contentGroups = Object.keys(contentDefaults) as ContentGroup[]

// ---------------------------------------------------------------------------------------------
// Reading and checking stored content.

type Json = unknown
const isObject = (value: Json): value is Record<string, Json> => typeof value === 'object' && value !== null && !Array.isArray(value)

function blankFrom(field: AnyField, fallback: Json): Json {
  if (field.type === 'text') return ''
  if (field.type === 'icon' || field.type === 'image' || field.type === 'toggle') return fallback
  return []
}

/** A new, empty list item for the editor, with images and icons copied from the first default item. */
export function newListItem(field: ListField, defaults: Json[]): Record<string, Json> {
  const template = (isObject(defaults[0]) ? defaults[0] : {}) as Record<string, Json>
  return Object.fromEntries(Object.entries(field.fields as Record<string, AnyField>).map(([key, f]) => [key, blankFrom(f, template[key])]))
}

type Problems = Record<string, string>

/**
 * Turns stored JSON into a field value, falling back to the default for anything unusable.
 * With `problems`, it also records why a value was rejected (for the save endpoint).
 */
function readField(field: AnyField, fallback: Json, raw: Json, path: string, problems?: Problems): Json {
  const problem = (message: string) => { if (problems) problems[path] = message }
  switch (field.type) {
    case 'text': {
      if (typeof raw !== 'string') return fallback
      const value = raw.replace(/\r\n/g, '\n').trim()
      if (!value && !field.optional) { problem(`Enter ${field.label.toLowerCase()}.`); return fallback }
      if (field.max && value.length > field.max) { problem(`Keep this under ${field.max} characters.`); return value.slice(0, field.max) }
      return field.multiline ? value : value.replace(/\s*\n\s*/g, ' ')
    }
    case 'toggle':
      if (typeof raw === 'boolean') return raw
      if (raw !== undefined) problem('Switch this on or off.')
      return fallback
    case 'icon':
      if (typeof raw === 'string' && (iconNames as readonly string[]).includes(raw)) return raw
      if (raw !== undefined) problem('Choose an icon from the list.')
      return fallback
    case 'image': {
      if (!isObject(raw) || typeof raw.src !== 'string' || !isImageSrc(raw.src)) {
        if (raw !== undefined) problem('Choose a built-in image or upload a photo.')
        return fallback
      }
      const alt = typeof raw.alt === 'string' ? raw.alt.trim().slice(0, 300) : ''
      if (!alt) problem('Describe the image for people who cannot see it.')
      return { src: raw.src, alt: alt || (fallback as ImageValue).alt }
    }
    case 'strings': {
      if (!Array.isArray(raw)) return fallback
      const items = raw.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
      if (items.some((item) => !item)) problem(`Fill in or remove the empty ${field.itemLabel.toLowerCase()}.`)
      if (field.maxLength && items.some((item) => item.length > field.maxLength!)) problem(`Keep each ${field.itemLabel.toLowerCase()} under ${field.maxLength} characters.`)
      const kept = items.filter(Boolean).map((item) => (field.maxLength ? item.slice(0, field.maxLength) : item))
      if (kept.length > field.max) problem(`Use at most ${field.max}.`)
      if (kept.length < (field.min ?? 0)) { problem(`Add at least ${field.min}.`); return fallback }
      return kept.slice(0, field.max)
    }
    case 'list': {
      if (!Array.isArray(raw)) return fallback
      const defaults = fallback as Json[]
      if (raw.length > field.max) problem(`Use at most ${field.max}.`)
      if (raw.length < (field.min ?? 0)) { problem(`Add at least ${field.min}.`); return fallback }
      return raw.slice(0, field.max).map((item, index) =>
        readFields(field.fields as Record<string, AnyField>, (defaults[index] ?? newListItem(field, defaults)) as Record<string, Json>, item, `${path}.${index}`, problems))
    }
  }
}

function readFields(fields: Record<string, AnyField>, fallback: Record<string, Json>, raw: Json, path: string, problems?: Problems) {
  const source = isObject(raw) ? raw : {}
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, readField(field, fallback[key], source[key], path ? `${path}.${key}` : key, problems)]))
}

/** One group from stored JSON, merged over its defaults. */
export function readGroup<G extends ContentGroup>(group: G, raw: Json, problems?: Problems): SiteContent[G] {
  const form = contentForm[group] as GroupForm<Record<string, Record<string, Json>>>
  const defaults = contentDefaults[group] as Record<string, Record<string, Json>>
  const source = isObject(raw) ? raw : {}
  return Object.fromEntries(Object.entries(form.sections).map(([section, def]) =>
    [section, readFields(def.fields as Record<string, AnyField>, defaults[section], source[section], section, problems)])) as SiteContent[G]
}

export function readContent(raw: Json): SiteContent {
  const source = isObject(raw) ? raw : {}
  return Object.fromEntries(contentGroups.map((group) => [group, readGroup(group, source[group])])) as SiteContent
}

/** Strict check for saving one group: the cleaned value, and a message per field path that needs fixing. */
export function checkGroup<G extends ContentGroup>(group: G, raw: Json) {
  const problems: Problems = {}
  const value = readGroup(group, raw, problems)
  return { value, problems }
}

/** Every uploaded image the content points at, so files no longer used can be deleted. */
export function uploadedImages(value: Json, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((item) => uploadedImages(item, found))
  else if (isObject(value)) {
    if (typeof value.src === 'string' && isUploadSrc(value.src)) found.add(value.src)
    Object.values(value).forEach((item) => uploadedImages(item, found))
  }
  return found
}

/** Fills {church}, {street}, {locality} and {region} in every text field. */
export function fillTokens(content: SiteContent): SiteContent {
  const values: Record<string, string> = {
    church: content.site.identity.name,
    street: content.site.address.street,
    locality: content.site.address.locality,
    region: content.site.address.region,
  }
  const fill = (value: Json): Json => {
    if (typeof value === 'string') return value.replace(/\{(church|street|locality|region)\}/g, (_, key: string) => values[key])
    if (Array.isArray(value)) return value.map(fill)
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'src' ? item : fill(item)]))
    return value
  }
  return fill(content) as SiteContent
}
