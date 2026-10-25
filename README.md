# CheckIn

A daily check-in app for family caregivers of older adults. In under a minute a day, a caregiver rates how the person they care for is doing in four areas, tracks changes over time, and generates a report they can share with a doctor.

<!-- Add your logo here once it's exported, e.g.: ![CheckIn logo](assets/images/logo.png) -->

## Why I built this

<!-- YOUR STORY: who or what inspired the app, and the problem you saw. Judges remember this part most. -->

## What it does

**Daily check-in.** The caregiver picks one of five faces for each area (Memory, Speech, Mobility and Conversation) and can add a note for each. One check-in per day; submitting again the same day updates it.

**Check-in history.** The Reports tab lists every day's check-in, with the faces, ratings and notes. Days can be deleted.

**Trends.** Line charts show each area, or an overall average, over a day, week, month, 3 months or year, with gaps where check-ins were missed.

**Doctor-ready reports.** The app calculates averages and trends for the last 7, 30 and 91 days, and Google Gemini writes plain-language observations from those numbers. The report can be shared as a PDF or as a text message, and past reports are saved.

**Multiple people.** One caregiver can track more than one person.

## Screenshots

<!-- Add 3–4 screenshots: home check-in, Trends, Reports, and a PDF report. -->

## How the AI report works

The AI never does the math. The app computes every average, trend and missed-day count itself (`lib/report.ts`) and sends Gemini only that summary plus recent notes. Gemini returns written sections as structured JSON (`lib/ai.ts`), and the app builds the PDF around them (`lib/reportHtml.ts`). The score table and the caregiver's notes in the PDF come straight from the app's data, so the numbers a doctor sees can't be misstated by the AI.

The prompt instructs the model to describe patterns only: no diagnoses, no named conditions, and no medication or treatment suggestions.

## Built with

- React Native and Expo (SDK 58), written in TypeScript
- Expo Router for navigation
- AsyncStorage for on-device storage
- Google Gemini API for report text
- expo-print and expo-sharing for PDF export

## Running it

You'll need Node.js, the Expo Go app on your phone, and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/Toyboat1000/CheckIn.git
cd CheckIn
npm install
```

Copy `.env.example` to `.env` in the project root and add your key:

```
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here
```

Then start the app and scan the QR code with Expo Go:

```bash
npx expo start -c
```

PDF sharing needs a real phone; it doesn't work in the web version.

## Project structure

```
app/
  (tabs)/
    reports.tsx        Check-in history
    trends.tsx         Charts
    (home)/
      index.tsx        Daily check-in
      profile.tsx      People and AI reports
      settings.tsx     Delete all data
context/
  AppDataContext.tsx   App state, saved to AsyncStorage
lib/
  trends.ts            Chart data and demo data
  report.ts            Statistics sent to the AI
  ai.ts                Gemini request and prompt
  reportHtml.ts        PDF layout
  pdf.ts               PDF export and sharing
types/data.ts          Data types
utils/date.ts          Date helpers
```

## Privacy

All check-ins are stored only on the device. Nothing leaves the phone except when the caregiver taps **Generate report**: then the calculated averages, the person's first name and recent notes are sent to Google Gemini to write the report. The app shows this notice next to the button.

Because the API key uses Expo's `EXPO_PUBLIC_` prefix, it's included in the app bundle. That's acceptable for a demo, but a public release would need a small server to hold the key, or let each user enter their own.

## Limitations

CheckIn is not a medical device and does not diagnose anything. Ratings are a caregiver's daily observations, not clinical measurements, and the four areas were chosen as things a caregiver can observe every day, not taken from a validated clinical instrument.

## What's next

- **Align the check-in with clinical domains.** Clinicians stage dementia with the Clinical Dementia Rating, which covers memory, orientation, judgment and problem solving, community affairs, home and hobbies, and personal care. A future version would add orientation and personal care so reports map more directly to what doctors already use.
- Move the API key to a server, or let users bring their own key.
- <!-- Anything else you'd add with more time -->

## AI use disclosure

<!--
Review and edit this section yourself so it's accurate. It needs to match what you write in your submission.
-->

I used AI assistants during development, as allowed by the Congressional App Challenge rules.

**What I did:** <!-- Check and complete this list. -->

- The app concept, the four check-in areas and the five-face rating scale
- UI design and the visual style of every screen
- The daily check-in screen and its flow
- The data model and the AsyncStorage persistence in `AppDataContext`
- The original Reports (history) page
- Testing on a real phone and directing every feature and fix
- <!-- add anything else -->

**What AI (Anthropic's Claude) helped write:**

- The Trends page and chart logic (`trends.tsx`, `lib/trends.ts`), including demo data
- The report statistics (`lib/report.ts`), the Gemini prompt and API call (`lib/ai.ts`), and the PDF template and export (`lib/reportHtml.ts`, `lib/pdf.ts`)
- The Profile page rebuild, saving reports, and delete-by-day on the Reports page
- The navigation restructure, Settings page cleanup, and several bug fixes
- Debugging the Expo SDK 57 → 58 upgrade

**AI inside the app:** report text is generated by Google Gemini, as described above.

## Author

<!-- Your name, school and grade, and congressional district -->
