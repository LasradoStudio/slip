/* Slip starter templates: one per freelance discipline.
   Applying one replaces intro, sections and terms; your brand and client stay.
   Prices are starting points in your chosen currency: adjust to your market. */
window.SlipTemplates = [
  {
    id: 'web', name: 'Web design & development', scene: 'browser', tags: 'website web design developer ui ux wordpress shopify',
    tagline: 'Design · Build · Launch',
    intro: 'Here’s how we’ll take your website from first sketch to launch: a clear structure, a design that feels like your brand, and a fast, easy-to-edit site.',
    items: [
      { d: 'Discovery & sitemap', q: 1, r: 450, t: '1 week', x: 'Kick-off call and goals workshop\nCompetitor and audience review\nSitemap and page priorities\nContent checklist for your team', m: { k: 'scene', v: 'chat' } },
      { d: 'UI design', q: 1, r: 1800, t: '2 weeks', x: 'Homepage and up to 6 inner page designs\nDesktop and mobile layouts\nClickable prototype for review\nTwo rounds of revisions', m: { k: 'scene', v: 'browser' } },
      { d: 'Development', q: 1, r: 2600, t: '2-3 weeks', x: 'Built on your chosen CMS, fully responsive\nContact forms and analytics set up\nSpeed, accessibility and on-page SEO basics\nEditable content blocks, no code needed', m: { k: 'scene', v: 'code' } },
      { d: 'Launch & handover', q: 1, r: 400, t: '3 days', x: 'Domain, hosting and SSL set-up\nCross-browser and device testing\nRecorded walkthrough of the CMS\n14 days of post-launch fixes', m: { k: 'scene', v: 'devices' } },
    ],
    notes: '50% deposit to start, 50% on launch. Two revision rounds are included per design stage; extra changes are billed hourly. Hosting, domains and paid plugins are billed at cost.',
  },
  {
    id: 'brand', name: 'Branding & identity', scene: 'brand', tags: 'brand logo identity guidelines rebrand',
    tagline: 'Identity · Strategy · Story',
    intro: 'A brand that’s instantly recognisable and easy for your team to use everywhere, built on a short strategy phase so every design decision has a reason.',
    items: [
      { d: 'Brand strategy', q: 1, r: 600, t: '1 week', x: 'Workshop on values, audience and tone\nPositioning statement\nMood boards in two directions', m: { k: 'scene', v: 'chat' } },
      { d: 'Logo design', q: 1, r: 1400, t: '2 weeks', x: 'Three initial concepts\nRefinement of the chosen route\nPrimary, secondary and icon versions\nFiles for print, web and social', m: { k: 'scene', v: 'brand' } },
      { d: 'Visual identity system', q: 1, r: 900, t: '1 week', x: 'Colour palette and typography\nGraphic elements and patterns\nSocial and stationery templates', m: { k: 'scene', v: 'print' } },
      { d: 'Brand guidelines', q: 1, r: 500, t: '4-5 days', x: 'Easy-to-follow PDF guide\nDo’s and don’ts with examples\nHandover call with your team', m: { k: 'scene', v: 'orbit' } },
    ],
    notes: '50% deposit to start, 50% on final delivery. Includes two revision rounds on the chosen logo route. Full rights transfer on final payment.',
  },
  {
    id: 'print', name: 'Graphic design & print', scene: 'print', tags: 'flyer brochure poster print menu packaging graphic',
    tagline: 'Print · Layout · Detail',
    intro: 'Print pieces that look sharp, read easily and arrive print-ready, so your printer has nothing to fix.',
    items: [
      { d: 'Flyer design', q: 1, r: 180, t: '3-4 days', x: 'A5 double-sided layout\nTwo design options\nPrint-ready PDF with bleed', m: { k: 'scene', v: 'print' } },
      { d: 'Brochure design', q: 8, r: 95, t: '1.5 weeks', x: 'Per page, cover included\nLayout, image editing and typesetting\nTwo revision rounds', m: { k: 'scene', v: 'print' } },
      { d: 'Social versions', q: 1, r: 120, t: '2 days', x: 'Resized for Instagram, Facebook and LinkedIn\nStory and feed formats', m: { k: 'scene', v: 'social' } },
    ],
    notes: '50% upfront, balance before final files are released. Printing costs are not included; I’m happy to coordinate with your printer.',
  },
  {
    id: 'video', name: 'Video production & editing', scene: 'motion', tags: 'video edit editing youtube reel promo filming',
    tagline: 'Shoot · Edit · Share',
    intro: 'A short, punchy video that tells your story in under two minutes, plus cut-downs ready for every social platform.',
    items: [
      { d: 'Pre-production', q: 1, r: 500, t: '1 week', x: 'Creative concept and script\nShot list and storyboard\nLocation and schedule planning', m: { k: 'scene', v: 'chat' } },
      { d: 'Filming day', q: 1, r: 1200, t: '1 day', x: 'Camera operator and sound\n4K footage, lighting kit included\nUp to 8 hours on location', m: { k: 'scene', v: 'motion' } },
      { d: 'Editing & colour', q: 1, r: 1100, t: '1.5 weeks', x: '90-second hero edit\nColour grading and sound mix\nLicensed music\nTwo rounds of revisions', m: { k: 'scene', v: 'motion' } },
      { d: 'Social cut-downs', q: 3, r: 150, t: '3 days', x: 'Vertical 9:16 and square versions\nCaptions burned in', m: { k: 'scene', v: 'social' } },
    ],
    notes: '50% deposit to book the shoot date, balance on delivery. Travel outside the city and extra shoot days are quoted separately. Raw footage available on request.',
  },
  {
    id: 'motion', name: 'Motion graphics & animation', scene: 'motion', tags: 'animation motion explainer 2d logo animation icons',
    tagline: 'Motion · Story · Clarity',
    intro: 'An animated explainer that makes your product click in seconds, from script to final render, with your brand in every frame.',
    items: [
      { d: 'Script & storyboard', q: 1, r: 450, t: '1 week', x: 'Script up to 120 words\nIllustrated storyboard frames\nVoice-over direction', m: { k: 'scene', v: 'chat' } },
      { d: 'Illustration & style frames', q: 1, r: 800, t: '1 week', x: 'Characters and scenes in your brand style\nThree style frames for approval', m: { k: 'scene', v: 'brand' } },
      { d: 'Animation', q: 60, r: 28, t: '2 weeks', x: 'Per second of finished animation\nSmooth 2D motion and transitions\nSound design and music', m: { k: 'scene', v: 'motion' } },
      { d: 'Icon animations', q: 6, r: 45, t: '4 days', x: 'Lottie/JSON files for web and apps\nGIF and MP4 versions', m: { k: 'scene', v: 'orbit' } },
    ],
    notes: '50% to start, 50% on final delivery. Voice-over talent is billed at cost. Changes after animation starts may affect timeline and price.',
  },
  {
    id: '3d', name: '3D rendering & visualisation', scene: 'cube', tags: '3d render blender product cgi architectural visualization model',
    tagline: 'Model · Light · Render',
    intro: 'Photoreal renders of your product that are ready for the web, ads and packaging, without the cost of a studio shoot.',
    items: [
      { d: '3D modelling', q: 1, r: 700, t: '1 week', x: 'Accurate model from CAD, photos or sketches\nMaterials and textures matched to samples\nOne review round on the model', m: { k: 'scene', v: 'cube' } },
      { d: 'Still renders', q: 6, r: 120, t: '1 week', x: 'Studio and lifestyle angles\n4K resolution, transparent backgrounds\nTwo rounds of revisions', m: { k: 'scene', v: 'cube' } },
      { d: '360° turntable', q: 1, r: 450, t: '4 days', x: '10-second looping animation\nMP4 and web-ready GIF', m: { k: 'scene', v: 'motion' } },
      { d: 'Product animation', q: 1, r: 1200, t: '1.5 weeks', x: '20-30 second hero animation\nExploded view and feature callouts\nMusic and sound design', m: { k: 'scene', v: 'motion' } },
    ],
    notes: '50% upfront, 50% on delivery. Source files (.blend) available for an additional fee. Changes to the model after render approval are billed hourly.',
  },
  {
    id: 'social', name: 'Social media management', scene: 'social', tags: 'social media instagram tiktok linkedin content calendar retainer',
    tagline: 'Plan · Post · Grow',
    intro: 'A consistent, on-brand social presence every month: planned ahead, designed in-house, and reported on so you can see what’s working.',
    items: [
      { d: 'Strategy & content calendar', q: 1, r: 350, t: 'Monthly', x: 'Monthly themes and post plan\nHashtag and timing research\nApproval before anything goes live', m: { k: 'scene', v: 'growth' } },
      { d: 'Content creation', q: 12, r: 60, t: 'Monthly', x: 'Per post: design and caption\nMix of carousels, reels and stories\nTwo platforms included', m: { k: 'scene', v: 'social' } },
      { d: 'Community management', q: 1, r: 300, t: 'Monthly', x: 'Replies to comments and DMs on weekdays\nEngagement with relevant accounts', m: { k: 'scene', v: 'chat' } },
      { d: 'Monthly report', q: 1, r: 120, t: 'Monthly', x: 'Reach, engagement and follower growth\nTop posts and next month’s plan', m: { k: 'scene', v: 'growth' } },
    ],
    notes: 'Billed monthly in advance, minimum three-month term. Paid ad spend is billed separately. 30 days’ notice to cancel.',
  },
  {
    id: 'seo', name: 'SEO & content marketing', scene: 'growth', tags: 'seo marketing content blog ranking google ads',
    tagline: 'Found · Trusted · Chosen',
    intro: 'A practical plan to get you found on Google by fixing what’s holding the site back, then publishing content your customers actually search for.',
    items: [
      { d: 'SEO audit', q: 1, r: 650, t: '1 week', x: 'Technical crawl and speed check\nKeyword and competitor gap analysis\nPrioritised fix list', m: { k: 'scene', v: 'growth' } },
      { d: 'On-page optimisation', q: 10, r: 60, t: '2 weeks', x: 'Per page: titles, meta and headings\nInternal linking and schema\nImage and speed fixes', m: { k: 'scene', v: 'code' } },
      { d: 'Blog articles', q: 4, r: 180, t: 'Monthly', x: '1,200-word articles per month\nKeyword-led topics, written for people\nImages and on-page SEO included', m: { k: 'scene', v: 'browser' } },
      { d: 'Reporting', q: 1, r: 150, t: 'Monthly', x: 'Rankings, traffic and conversions\nNext steps each month', m: { k: 'scene', v: 'growth' } },
    ],
    notes: 'Audit and optimisation billed 50% upfront. Monthly content billed in advance. SEO results build over 3-6 months; rankings can’t be guaranteed.',
  },
  {
    id: 'photo', name: 'Photography', scene: 'photo', tags: 'photography photo shoot product event portrait headshot',
    tagline: 'Light · Moment · Story',
    intro: 'Natural, on-brand photos you can use everywhere, planned around what you need, shot in one relaxed session, and edited to a consistent look.',
    items: [
      { d: 'Shoot planning', q: 1, r: 150, t: '3 days', x: 'Shot list and mood board\nLocation and styling advice', m: { k: 'scene', v: 'chat' } },
      { d: 'Photo session', q: 1, r: 900, t: '1 day', x: 'Up to 6 hours on location\nLighting equipment included\nAssistant on set', m: { k: 'scene', v: 'photo' } },
      { d: 'Editing & retouching', q: 40, r: 12, t: '1 week', x: 'Per final image\nColour grading and retouching\nWeb and print sizes', m: { k: 'scene', v: 'social' } },
    ],
    notes: '30% booking fee secures the date and is non-refundable. Balance due on delivery of the online gallery. Commercial usage licence included.',
  },
  {
    id: 'app', name: 'Mobile app development', scene: 'devices', tags: 'app mobile ios android flutter react native mvp',
    tagline: 'Design · Build · Ship',
    intro: 'A focused first version of your app, designed around your core user journey, built for iOS and Android, and ready to put in front of real users.',
    items: [
      { d: 'Product discovery', q: 1, r: 900, t: '1 week', x: 'User journeys and feature list\nMVP scope and priorities\nTechnical plan', m: { k: 'scene', v: 'chat' } },
      { d: 'UX & UI design', q: 1, r: 2400, t: '2-3 weeks', x: 'Up to 15 screens\nInteractive prototype\nDesign system for future features', m: { k: 'scene', v: 'devices' } },
      { d: 'App development', q: 1, r: 7800, t: '6-8 weeks', x: 'Cross-platform build for iOS and Android\nUser accounts and backend API\nPush notifications and analytics', m: { k: 'scene', v: 'code' } },
      { d: 'Testing & store launch', q: 1, r: 900, t: '1 week', x: 'QA on real devices\nApp Store and Play Store submission\n30 days of bug fixes', m: { k: 'scene', v: 'devices' } },
    ],
    notes: 'Billed in four milestones matching the sections above. Store developer accounts and third-party services are billed at cost. New features after sign-off are quoted separately.',
  },
  {
    id: 'copy', name: 'Copywriting', scene: 'chat', tags: 'copywriting copy writing content website copy email newsletter',
    tagline: 'Words that work',
    intro: 'Clear, persuasive copy in your voice, written to turn visitors into enquiries, with room for your feedback at every step.',
    items: [
      { d: 'Voice & messaging', q: 1, r: 400, t: '1 week', x: 'Interview with you and your team\nTone of voice guide\nKey messages and taglines', m: { k: 'scene', v: 'chat' } },
      { d: 'Website copy', q: 6, r: 160, t: '2 weeks', x: 'Per page, SEO-friendly\nHeadlines, body and calls to action\nTwo rounds of edits', m: { k: 'scene', v: 'browser' } },
      { d: 'Email sequence', q: 5, r: 90, t: '1 week', x: 'Per email: welcome or sales sequence\nSubject line options', m: { k: 'scene', v: 'chat' } },
    ],
    notes: '50% to start, balance on final copy. Two edit rounds per piece; further edits billed hourly. You own the copy on final payment.',
  },
  {
    id: 'care', name: 'Website care plan', scene: 'chat', tags: 'maintenance hosting support retainer care plan updates',
    tagline: 'Secure · Fast · Looked after',
    intro: 'Peace of mind for your website: updates, backups and small changes handled every month, so you can focus on your business.',
    items: [
      { d: 'Hosting & security', q: 1, r: 45, t: 'Monthly', x: 'Managed hosting with SSL\nDaily backups and uptime monitoring\nSecurity scans and fixes', m: { k: 'scene', v: 'code' } },
      { d: 'Updates & maintenance', q: 1, r: 60, t: 'Monthly', x: 'CMS, theme and plugin updates\nMonthly speed check', m: { k: 'scene', v: 'browser' } },
      { d: 'Content changes', q: 2, r: 50, t: 'Monthly', x: 'Hours of edits each month\nText, images and new pages\nUnused hours roll over one month', m: { k: 'scene', v: 'chat' } },
    ],
    notes: 'Billed monthly in advance. 12-month term, then rolling monthly. Larger projects are quoted separately at a 10% discount for care-plan clients.',
  },
];
