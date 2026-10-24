# Tech Helper

A simple website that helps older people, and anyone new to technology, with any question about phones, computers, apps, or AI. They speak or type a question in their own language and get large, one-at-a-time steps they can have read aloud. On any step they can send a screenshot and the app circles where to tap.

Nothing is stored on a server. Saved guides, settings, and the family contact stay on the learner's phone.

## Set it up (owner)

1. **Create an Anthropic API key** at https://console.anthropic.com → API Keys.
2. **Set a monthly spend limit** in the Anthropic console (Settings → Limits). This is the hard cap on what the app can cost you.
3. **Add the key to Vercel**: Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`, then redeploy.
4. **Add the rate-limit rule** in Vercel: Project → Firewall → Rules → New rule. Match requests whose path starts with `/api/ask`, `/api/locate`, `/api/scam` or `/api/camera`, action **Rate Limit**, 40 requests per IP per day. This stops a stranger who finds the link from using up your spend limit.

Each phone can also make at most 30 requests a day; the app explains this kindly when it's reached.

## Install it on the learner's phone (family helper)

Do this first, before setting anything up, so the saved data lives in the installed app:

- **iPhone or iPad:** open the link in Safari, tap the Share button (square with an arrow), then **Add to Home Screen** → **Add**. From then on, always open it from the new icon. (iPhones keep the home-screen app's data separate from Safari.)
- **Android:** open the link in Chrome, tap the ⋮ menu, then **Add to Home screen** or **Install app**.

Then open the app from the icon, set up **Call family** with your name and number, and pick the learner's speaking language with **Change language**.

## Privacy

The app does not save screenshots, camera photos or questions. Each question, screenshot and photo is sent to Anthropic's AI service to be answered, and Anthropic keeps API inputs for a limited time under its own policy. The app reminds the learner not to send bank, password, or private-message screens, or photos of bank cards, passwords or documents. A screenshot sent during a guide ("That's not what I see", "Check my screen") is kept in the page's memory only until the guide is closed, so "I'm stuck" can look at it again, and "Ask my family" can include it when the learner ticks "Include my screenshot" (off by default; it goes only through the phone's own share sheet and is never uploaded or saved). Practice screens are pretend: nothing on them is sent anywhere.

## Change the AI model

The model is set in one place: `MODEL` in `lib/ai/client.ts` (currently `claude-opus-5-5`). Switching to `claude-haiku-5-5` costs about a tenth as much but gives weaker answers.

## Develop

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, or set FAKE_AI=1 to use fixed test answers
npm run dev
```

Checks:

```bash
npm test            # unit and component tests (fake AI)
npx tsc --noEmit    # type check
npm run lint
npm run build
npm run test:e2e    # browser tests at phone size (fake AI)
```

The plan this app was built from is in `docs/plans/`.
