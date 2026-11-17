# NOBA संवाद 2026 — Alumni Magazine & Subscription Funnel
**Netarhat Vidyalaya Old Boys’ Association — Global Social Responsibility (NOBA GSR)**

Production standalone repository for the official **NOBA संवाद 2026** lead and subscription funnel.
- Live URL: [https://noba-samvad.pages.dev/](https://noba-samvad.pages.dev/)
- WhatsApp Community: [Join Group](https://chat.whatsapp.com/JyTPCCW0P44Kl2LVuvaoCo)
- Full 84-Page Magazine: [Google Drive Edition](https://drive.google.com/file/d/1J1hYRjsv6WMu1c6gfZu__Mp4dQ39Ptmt/view?usp=sharing)

---

## Architecture
- **Root**: `index.html` (Alumni opt-in and presentation portal)
- **Confirmation**: `thank-you.html` (Personalized confirmation summary and community CTA)
- **Highlights**: `highlights.html` (Executive 3-page web edition) & `noba-samvad-2026-highlights.pdf`
- **Submission API**: Cloudflare Pages Function `/functions/submit.js` routing to Google Workspace Apps Script Web App
- **Database**: Automated Google Sheets registry (`NOBA Samvad Subscribers`) with 1,500/day email dispatch capacity via Google Workspace (`@thebusinesseutopia.com`).

---

## Clean URLs
- `/` &rarr; Main magazine portal & subscription form
- `/thank-you` &rarr; Personalized confirmation page
- `/highlights` &rarr; Online executive highlights
- `/magazine` &rarr; Full 84-page Google Drive PDF
- `/whatsapp` &rarr; Instant 1-click community group join
- `/pdf` &rarr; Downloadable 3-page highlights brief (PDF)
