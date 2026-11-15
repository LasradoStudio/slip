# Slip: animated quotes, proposals & invoices

You fill in your brand, the client and the sections, then send the client a link. They
get an animated proposal with **Download PDF** and **Accept** buttons.

- **No server, no account.** The whole document is compressed into the link (`#q=…`), so any static host works.
- **Files.** The app is `index.html`, `style.css`, `proposal.css`, `config.js`, `scenes.js`, `templates.js`, `ai.js` and `app.js`.
- **No build step.** Settings you can change live in `config.js`.

## Homepage & your documents

The **homepage** has a live sample proposal and a highlighted **"Pick up where you left off"** strip with your 3 most recent documents. Its **View all documents →** button opens the **Documents page** (`#docs`, also in the top nav and footer, and the editor's logo goes there too), which has search, Quotes/Invoices filters, Export/Import, Google Drive sync and the full list.

Every quote and invoice saves automatically ("Saved ✓" appears next to the logo while you edit), and each card has these actions:

- **Open**, **Duplicate**, **Copy link**, **Delete** (with Undo).
- **→ Invoice:** turns a quote into an invoice with the next invoice number and a due date 14 days out.
- **New** in the editor starts a fresh document with your brand, layout and terms copied over. Numbers go up automatically (`Q-2026-001` → `Q-2026-002`).
- **Export / Import:** everything lives in this browser, so export a backup file to move your documents to another device or keep a copy. (Videos uploaded without Cloudinary don't come along.)

### Where documents are saved

By default, documents are saved in the visitor's own browser (`localStorage`), on that device only. Nothing goes to a server. Clearing browser data, using a private window, or switching computers means they're not there, which is why there's **Export / Import**, and optionally **Google Drive sync**.

## Google Drive sync (optional)

Visitors click **Connect Google Drive** and sign in with Google. Slip then keeps a copy of all their documents in their own Drive (a folder called **Slip**, file `Slip documents.json`), and syncs a few seconds after each change. On another device they connect the same Google account and everything appears.

- **Permissions:** Slip asks only for the `drive.file` permission, so it can only see the files it created, nothing else in their Drive.
- **Conflicts:** the newest edit of each document wins, and deletes sync too.
- **Sign-in expiry:** sign-in lasts about an hour. After that, the homepage shows **Sync now** to continue.

**One-time setup (you, about 10 minutes, free):**
1. Go to <https://console.cloud.google.com/> and create a project, e.g. "Slip".
2. **APIs & Services → Library**: enable the **Google Drive API**.
3. **APIs & Services → OAuth consent screen** (or *Google Auth Platform → Branding*): app name "Slip", your support email, user type **External**. Add the scope `.../auth/drive.file`, then publish the app (this scope doesn't need Google's review).
4. **Credentials → Create credentials → OAuth client ID → Web application**. Under **Authorized JavaScript origins**, add your site, e.g. `https://yourname.github.io`, plus `http://localhost:5179` for testing.
5. Copy the client ID (`….apps.googleusercontent.com`) into `config.js` → `google.clientId` and redeploy.

Until a client ID is set, the button shows a setup reminder on localhost and is hidden on your live site.

## Tips ("Support Slip")

Open `config.js` and fill in one or more links. Each can have a small `note` line under its button. The **Support** box, nav link and footer link appear once a link is filled in. On `localhost`, a reminder box shows where the buttons will go.

**Receiving international tips in an Indian bank account** (check each provider's current terms; they change):

| Option | Who can pay | How it reaches you |
|---|---|---|
| **PayPal** (`paypal.me/you`) | Anyone, card or PayPal, from any country | PayPal transfers to your linked Indian bank in INR. Fees plus a currency markup apply. |
| **Ko-fi** | Anyone, any country | Connect your PayPal; tips land in PayPal, then go to your bank. |
| **Razorpay Payment Page** | Indian cards, UPI, netbanking. International cards once Razorpay approves international payments | Settles to your Indian bank |
| **UPI ID** (copy button) | India only | Instant, free |

Buy Me a Coffee and Stripe links also work in `config.js`, but Stripe is invite-only in India, so check that payouts work for you first.

## Feedback ("Help shape the next update")

A homepage box where visitors pick features they'd like (the chips are editable in `config.js → feedback.ideas`) and write a message. They can add their email if they'd like a reply. Choose **one** free way to receive it in `config.js → feedback`:

- **Formspree:** create a form at formspree.io and paste its endpoint. Messages arrive in your email.
- **Web3Forms:** get an access key at web3forms.com and paste the endpoint and key.
- **Email only:** set `email`, and the visitor's email app opens with the message ready to send.

The box (and its nav and footer links) appear once one is set.

## Footer

The footer has Create links, your documents, feedback and support links, a short privacy note, and **"Made by Neil Lasrado"**. Set `config.js → author.url` to your website (starting with `https://`). Your name becomes a link, and a "Creator's website" link appears too.

## Adding sections

The Sections card always shows **"One section per thing you charge for"** with an **Add section** button. The live preview has a big **+ Add another section** card after the last section. Click it and type the title right on the page.

## Edit right on the page

In the editor's live preview, **click any text and type**: names, tagline, intro, section titles, timelines, bullets, prices and terms. The form on the left updates as you go.

- In a list of points, **Enter** adds a new point, and **Backspace** on an empty point removes it. Hover the list to see **+ Add point**.
- Clicking a price shows the plain number. Type a new one and the totals update.
- Your client's link is read-only. Editing only happens in your editor.

## Reframe images & videos

Hover any image or video in the preview and click **⤢ Reframe**. Drag to choose what's in view, scroll or use the slider to zoom (up to 3×), then click **Done** or press Enter (Esc cancels). The framing is saved with the document and applies to the client view, the PDF and the form thumbnail. **Change** on the same toolbar opens the visual picker.

## Layouts

| Layout | What the client sees |
|---|---|
| **Proposal** | Gradient cover with your logo and tagline → an overview with your intro and a clickable scope table (section, timeline, cost) → **one page per section** with a title, estimated delivery, price badge, a list of what's included, and a visual → terms with the total and a banner → a thank-you page with your contact details. Pages reveal as the client scrolls. The PDF prints as 16:9 slides. |
| **Classic** | One clean page with a count-up total. Each line can show a timeline and details. The PDF prints on A4. |

In the section details, each line becomes a ticked bullet. Type `---` on its own line for a divider.

## Visuals for each section (Proposal)

Click the thumbnail next to a section to pick one of these:

1. **Motion**: 12 built-in looping animations (Website, Development, Responsive, Print, Branding, Growth, Video, Social, Support, Photography, 3D, Abstract). They're tinted to your brand colour and add almost nothing to the link. By default, **Auto-match** picks one from the section title: "Flyer update" → Print, "Website redesign" → Website.
2. **Stock** (no API key needed):
   - **Free library:** search millions of images cleared for commercial use, via [Openverse](https://openverse.org), from inside Slip. No account needed, and the photographer's credit is added automatically. The search starts with words that suit the section, like "laptop desk" for a website section.
   - **Browse sites:** opens Pexels, Unsplash, Freepik, Pixabay, Mixkit or Pinterest in a new tab, already searching your words, so you can use your own account there. Each site has a tip for bringing the file back:
     - **Pexels:** paste the page link.
     - **Unsplash / Pinterest:** *Copy image address*.
     - **Freepik / Pixabay / Mixkit:** download the file, then **Upload** (these sites don't allow linking straight to their files).
   - **Pexels (optional):** add a free key from <https://www.pexels.com/api/> to search Pexels photos **and videos** inside Slip. The key is saved only in your browser.
3. **Link**: paste a YouTube or Vimeo link (plays muted on a loop), a direct `.mp4`, or any image URL.
   - **Pexels:** paste a photo's normal page link (`pexels.com/photo/…`) and Slip finds the image by itself. For videos, right-click the playing video → *Copy video address*.
   - **Pinterest / Unsplash:** right-click the image → *Copy image address*.
   - If a link doesn't load, Slip tells you before you use it.
   - **Your own files:** put them in a `media/` folder in this repo and paste `media/my-video.mp4`.
4. **Upload**:
   - **Images** are compressed and stored inside the link, so they work everywhere.
   - **Videos** only play on your own device until you connect **Cloudinary** (free). In Cloudinary, create an *unsigned upload preset* and enter the cloud name and preset under Upload. After that, uploaded videos work in shared links too.

### Drag & drop

You can also skip the picker and drag visuals straight in:

- **Files:** drop an image or video from your computer onto a section's thumbnail in the form, or onto the section's page in the live preview. The closing banner works the same way.
- **From another tab:** drag an image from Pexels, Unsplash, Pinterest or similar onto a section. Slip checks that the site allows its files to be used elsewhere. If it doesn't (Pixabay, Freepik), Slip tells you to download the file and drop that instead.
- **Swap:** drag one section's thumbnail onto another to swap their visuals.
- **Picker:** while the picker is open, drop anywhere inside it.

While you drag, every place you can drop gets an outline and a hint appears at the bottom. Uploaded files follow the same rules as **Upload**: images go into the link, and videos need Cloudinary to work in shared links.

Why not Pinterest directly? Its API only works for approved developer apps with a user sign-in, which a static site can't do. Pexels covers the same need (free photos and videos), and Pinterest image links still work through **Link**.

## Templates

Click **Start → Templates** to fill the proposal from one of 12 industry templates:

- Web design & development
- Branding & identity
- Graphic design & print
- Video production
- Motion graphics
- 3D rendering & visualisation
- Social media management
- SEO & content
- Photography
- Mobile apps
- Copywriting
- Website care plans

Each template has sections, timelines, what's included, a matching visual, starting prices and payment terms. Your brand, client and layout don't change, and **Undo** appears for a few seconds after applying.

To add your own template, add an entry to `templates.js`.

## AI drafting: use your own account

Click **Start → Draft with AI** and describe the job, including the budget and deadline. You review the result before it changes anything, and you can undo after applying. **Polish my draft** rewrites what you already have. The **✨ Write** button next to a section fills in that section's timeline and what's included.

| Option | What you need | How it works |
|---|---|---|
| **Any chatbot** | Nothing. Use your ChatGPT, Claude, Gemini or Copilot account | Slip copies a prompt. You paste it into the chat, then paste the reply back. |
| **Claude** | API key from console.anthropic.com | Runs inside Slip (official Anthropic SDK, default model `claude-opus-5-5`). |
| **ChatGPT** | API key from platform.openai.com | Runs inside Slip (default model `gpt-5`, editable). |
| **Gemini** | API key from aistudio.google.com | Runs inside Slip (default model `gemini-2.5-flash`, editable). |
| **Other** | Base URL + model (+ key) | Any OpenAI-compatible service: **GitHub Models** (the API behind Copilot), OpenRouter, Ollama on your machine, and others. |

- **API keys are separate from chat subscriptions.** A ChatGPT Plus, Claude Pro or Copilot subscription doesn't include API access. To use a subscription, choose **Any chatbot**.
- **Microsoft Copilot has no public API.** Use the chatbot option, or GitHub Models under **Other**.
- **Where keys are kept.** Keys are saved only in your browser (`localStorage`) and sent straight to the provider. They never go into share links. Anyone using the same browser profile could use them, so set a spending limit in the provider's console.
- **Cost.** One full draft costs a few cents of API usage.

## Run locally

```bash
npx serve .
```

## Deploy (free)

- **GitHub Pages:** push to a repo, then go to Settings → Pages → *Deploy from a branch* → `main` / root.
- **Netlify:** drag the folder onto <https://app.netlify.com/drop>.
- **Vercel:** run `npx vercel` in the folder.

Links made on one host only open on that host, because the link includes the page address. Deploy first, then create the links you send to clients.

## Notes

- **Link length.** Text-only links are about 1-2 KB. Each uploaded image adds roughly 10-80 KB. For the shortest links, use Motion, Stock, Link, or Cloudinary instead of embedding images.
- **Security.** Everything read from a link is checked and HTML-escaped. Only https or `media/` sources and known video IDs are allowed.
- **Privacy.** Anyone with the link can see the document. Treat it like sending a PDF.
- **Google Drive.** If you add Google Drive sync, Google's sign-in script loads only when someone clicks **Connect Google Drive**.
- **Motion.** Animation is off if the viewer's system is set to reduce motion.
- **Local preview.** `.claude/launch.json` is only for previewing inside Claude, so you can leave it out of your repo.
