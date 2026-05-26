# UnhingeTV — Apple Age Rating Questionnaire

Target rating: **17+ Mature**. Profile: frequent/intense profanity + suggestive themes (reality/comedy/dating content). Pick these answers verbatim in App Store Connect → App Information → Age Rating.

## Apple's 2024+ questionnaire (App Store Connect)

| Category | Answer | Rationale |
|---|---|---|
| Cartoon or Fantasy Violence | **None** | No animated violence |
| Realistic Violence | **None** | No depicted real violence |
| Prolonged Graphic or Sadistic Realistic Violence | **None** | — |
| Violence Between Cartoon Characters or Fantasy Characters | **None** | — |
| Profanity or Crude Humor | **Frequent/Intense** | Adult reality/comedy series — uncensored language is core to the brand ("UnhingeTV") |
| Sexual Content or Nudity | **Infrequent/Mild** | Suggestive dating/romance content (Risk 4 Romance, Finding Love for EJ); no explicit nudity |
| Graphic Sexual Content and Nudity | **None** | Not an adult-entertainment app |
| Mature/Suggestive Themes | **Frequent/Intense** | Dating, drinking (Wild 'N Turnt 21+), adult relationship themes |
| Horror/Fear Themes | **None** | — |
| Medical/Treatment Information | **None** | — |
| Alcohol, Tobacco, or Drug Use or References | **Infrequent/Mild** | Wild 'N Turnt 21+ involves alcohol references in social settings |
| Simulated Gambling | **None** | — |
| Contests | **None** | No in-app contests |

## Additional toggles
- **Unrestricted Web Access**: **No** — app only displays curated UnhingeTV catalog; no in-app browser.
- **Gambling**: **No**
- **Age verification**: We perform our own DOB age gate (18+) in addition to Apple's rating. Mention in App Review Notes.
- **Made for Kids**: **No**

## Expected result
With Frequent Profanity + Frequent Mature Themes selected, Apple's matrix returns **17+**. This is the floor — anything lower will trigger a 1.1.6 rejection given the brand and show titles ("Wild 'N Turnt 21+", "CAUGHT IN 4K", etc.).

## App Review Notes — paste verbatim
```
UnhingeTV is an adult streaming network (17+). The app enforces an additional 18+ DOB age gate on first launch before any catalog content is shown (see /age-gate route). All subscription purchases are made via Apple In-App Purchase — no external payment paths exist in the iOS app. Subscribers from our web platform can also sign in and stream on iOS as a multiplatform-services reader (Guideline 3.1.3(b)).

Sandbox test account:
  email: <FILL IN before submitting>
  password: <FILL IN>

This account has an active sandbox subscription so the reviewer can immediately access streaming content without purchasing.
```
