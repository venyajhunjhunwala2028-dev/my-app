# Tech Helper

A simple website that helps older people, and anyone new to technology, with any question about phones, computers, apps, or AI. They speak or type a question in their own language and get large, one-at-a-time steps they can have read aloud. On any step they can send a screenshot and the app circles where to tap.

Nothing is stored on a server. Saved guides, settings, and the family contact stay on the learner's phone.

## Set it up (owner)

1. **Create an Anthropic API key** at https://console.anthropic.com → API Keys.
2. **Set a monthly spend limit** in the Anthropic console (Settings → Limits). This is the hard cap on what the app can cost you.
3. **Add the key to Vercel**: Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`, then redeploy.
4. **Add the rate-limit rule** in Vercel: Project → Firewall → Rules → New rule. Match requests whose path matches the regular expression `^/api/(ask|locate|scam|camera|billing)(/|$)` (that is, paths starting with `/api/ask`, `/api/locate`, `/api/scam`, `/api/camera` or `/api/billing`), action **Rate Limit**, 40 requests per IP per day. This stops a stranger who finds the link from using up your spend limit, or from hammering the payment routes.

Each phone can also make at most 30 requests a day; the app explains this kindly when it's reached.

## Tech Helper Plus (₹99 a month, Razorpay)

The main helper is free: asking, typing and speaking, every step-by-step guide, "What do I press?", camera help, the Help library, the scam check and automatic scam warnings, settings, devices, recent and saved help, Easy Mode, languages, voice and Call my family. **Tech Helper Plus** (₹99 a month, UPI AutoPay or card, through Razorpay Subscriptions) adds Teach me lessons, Practice and Ask my family. Locked features stay visible with a small "🔒 Plus" tag and open the paywall.

There is still no database and no account. Razorpay is the source of truth: after Checkout, the server checks Razorpay's signature and asks Razorpay that the subscription is authorised, then gives the phone a signed unlock token that lasts until the end of the paid month (plus 2 days' grace). The phone checks again in the background when the unlock ends within 3 days, or once a day. The restore code shown after paying is the Razorpay subscription id (`sub_…`): entering it on a new phone asks Razorpay again and unlocks Plus there.

> The lock is checked on the phone. A determined technical user could edit their own browser storage and open lessons, practice or Ask my family without paying. That is acceptable for these features: they run on the phone and cost nothing to serve, and every AI request stays limited as before.

### Set up payments (owner)

1. **Create a Razorpay account** at https://dashboard.razorpay.com and finish **KYC** (business or individual details, bank account).
2. **Fill in your business details** in `lib/business.ts`: business name, the name bank and UPI statements will show (for an individual account this is usually your legal name), contact email, phone, address, city for disputes and the date you publish. These are filled in; keep them in step with your Razorpay account. The Terms, Privacy, Cancellations and refunds, Shipping and delivery and Contact pages (`/terms`, `/privacy`, `/refunds`, `/shipping`, `/contact`) show them, and Razorpay checks these pages when it verifies your website. Have the pages reviewed if you are unsure about any wording.
3. **Start in Test mode** (the toggle at the top of the Razorpay dashboard).
4. **Create the plan**: Subscriptions → Plans → Create plan. Billing frequency **Monthly**, every **1** month, amount **₹99**, name "Tech Helper Plus". Copy its id (`plan_…`).
5. **Create test API keys**: Account & Settings → API Keys → Generate test key. Copy the Key Id (`rzp_test_…`) and Key Secret.
6. **Add four environment variables in Vercel** (Project → Settings → Environment Variables), then redeploy:
   - `RAZORPAY_KEY_ID` — the Key Id
   - `RAZORPAY_KEY_SECRET` — the Key Secret (never share it)
   - `RAZORPAY_PLAN_ID` — the plan id from step 4
   - `ENTITLEMENT_SECRET` — a long random string you make up (at least 16 characters; 32+ is better), e.g. from `openssl rand -base64 32`. It signs the unlock tokens. Changing it later just makes every phone check with Razorpay again.
7. **Try it** with Razorpay's test UPI ids and test cards (see Razorpay's "Test card and UPI details" page). Check that Plus unlocks, the restore code works in a private window, and Cancel my plan works.
8. **Go live** once KYC is approved: switch the dashboard to Live mode, create the same ₹99 monthly plan there (test plans don't carry over), generate live keys, and replace the three `RAZORPAY_*` values in Vercel with the live ones. Redeploy.

If any of the four variables is missing, payments are "not configured": the app shows the Plus offer, the button says "Payments aren't available yet", and everything free keeps working.

The billing routes are `/api/billing/config`, `/subscribe`, `/verify`, `/status` and `/cancel`. They log only short error codes (`billing_error:status_api_500`), never keys, ids or tokens. They are covered by the firewall rule above.

## Install it on the learner's phone (family helper)

Do this first, before setting anything up, so the saved data lives in the installed app:

- **iPhone or iPad:** open the link in Safari, tap the Share button (square with an arrow), then **Add to Home Screen** → **Add**. From then on, always open it from the new icon. (iPhones keep the home-screen app's data separate from Safari.)
- **Android:** open the link in Chrome, tap the ⋮ menu, then **Add to Home screen** or **Install app**.

Then open the app from the icon, set up **Call family** with your name and number, and pick the learner's speaking language with **Change language**.

## Privacy

The privacy policy shown to learners is `/privacy` (`app/privacy/page.tsx`); keep it in step with what's below.

The app does not save screenshots, camera photos or questions. Each question, screenshot and photo is sent to Anthropic's AI service to be answered, and Anthropic keeps API inputs for a limited time under its own policy. The app reminds the learner not to send bank, password, or private-message screens, or photos of bank cards, passwords or documents. A screenshot sent during a guide ("That's not what I see", "Check my screen") is kept in the page's memory only until the guide is closed, so "I'm stuck" can look at it again, and "Ask my family" can include it when the learner ticks "Include my screenshot" (off by default; it goes only through the phone's own share sheet and is never uploaded or saved). Practice screens are pretend: nothing on them is sent anywhere. Tech Helper Plus payments happen in Razorpay's own checkout: the app never sees card or UPI details. The phone keeps the subscription id (the restore code) and the server's unlock token; the server asks Razorpay for the subscription's status when needed and stores nothing.

## Change the AI model

The model is set in one place: `MODEL` in `lib/ai/client.ts` (currently `claude-opus-5-5`). Switching to `claude-haiku-5-5` costs about a tenth as much but gives weaker answers.

## Develop

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, or set FAKE_AI=1 to use fixed test answers;
                             # set FAKE_BILLING=1 for a pretend Razorpay (no real payments)
npm run dev
```

Checks:

```bash
npm test            # unit and component tests (fake AI)
npx tsc --noEmit    # type check
npm run lint
npm run build
npm run test:e2e    # browser tests at phone size (fake AI, fake Razorpay)
```

The plan this app was built from is in `docs/plans/`.
