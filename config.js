/* Slip site settings: edit this file, then redeploy.
   Delete the // at the start of a line to turn that option on. */
window.SlipConfig = {
  siteName: 'Slip by Lasrado',

  /* Where the "Made with Slip" credit at the end of every document points. */
  siteUrl: 'https://lasradostudio.github.io/slip/',

  /* FOOTER CREDIT: "Made by …" at the bottom of the homepage.
     Add your website (must start with https://) and your name becomes a link. */
  author: {
    name: 'Neil Lasrado',
    url: 'https://neillasrado.com',
  },

  /* ---------------------------------------------------------------
     TIPS: the "Support Slip" box on the homepage.
     It only appears once at least one link below is filled in.
     `note` is the small line shown under the button.

     Getting international money into an Indian bank account:
       • PayPal: supporters pay from anywhere with card or PayPal;
                   PayPal sends it to your linked Indian bank in INR.
                   Set up: paypal.com (India) → link your bank → paypal.me/yourname
       • Ko-fi: nice tip page; connect your PayPal and tips land there
                   (then PayPal → your bank, as above).
       • Razorpay Payment Page: cards + UPI + netbanking on one page;
                   international cards work once Razorpay approves
                   international payments on your account.
       • UPI: instant and free, but India only.
     Fees/eligibility change: check each provider's current terms.
     --------------------------------------------------------------- */
  tip: {
    title: 'Enjoying Slip?',
    message: 'Slip is free, with no sign-up and no ads. If it helped you win a client, a small tip keeps it going.',
    links: [
      { label: 'Buy me a coffee', url: 'https://buymeacoffee.com/neillasrado', note: 'Card · from any country' },
      // { label: 'Tip with PayPal', url: 'https://paypal.me/YOUR-NAME', note: 'Card or PayPal · from any country' },
      // { label: 'Ko-fi', url: 'https://ko-fi.com/YOUR-NAME', note: 'Buy me a coffee · any country' },
      // { label: 'Card / UPI', url: 'https://pages.razorpay.com/YOUR-PAGE', note: 'Razorpay · cards & UPI' },
      // { label: 'UPI', copy: 'yourname@okbank', note: 'India · copy the UPI ID' },
    ],
  },

  /* ---------------------------------------------------------------
     FEEDBACK: the "Help shape the next update" box on the homepage.
     Pick ONE way to receive messages (all free):
       A) Formspree: formspree.io → New form → copy its endpoint
       B) Web3Forms: web3forms.com → enter your email → copy the access key
       C) Email only: opens the visitor's email app, addressed to you
     --------------------------------------------------------------- */
  feedback: {
    endpoint: 'https://formspree.io/f/maeoedel',                                        // A
    // endpoint: 'https://api.web3forms.com/submit', accessKey: 'YOUR_ACCESS_KEY',      // B
    // email: 'you@example.com',                                                         // C
    ideas: [
      'Accept card payments on invoices',
      'Client e-signature',
      'Recurring invoices',
      'More templates',
      'Sync across devices',
      'Team / shared workspace',
      'Expense & profit tracking',
      'More languages & currencies',
    ],
  },

  /* ---------------------------------------------------------------
     GOOGLE DRIVE SYNC: lets people "Connect Google Drive" so their
     documents are saved to their own Drive and open on any device.
     Needs a free Google OAuth Client ID (see README → Google Drive sync).
     --------------------------------------------------------------- */
  google: {
    // clientId: 'YOUR-CLIENT-ID.apps.googleusercontent.com',
  },
};
