/**
 * Standalone Worker for NOBA Samvad 2026 Portal
 * Serves Static Assets (HTML, CSS, JS, Images, PDFs) + /submit API
 */

const NOBA_GSR_WORKSPACE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwEzicoFVKur2alBsuqHpY2SwalZh_7ss4Sq4QU4eTZh_sv5EVYRVMR8TGvLyjnRrIZ/exec";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle /submit API
    if (url.pathname === "/submit") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: 204 });
      }

      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: corsHeaders });
      }

      try {
        const rawLead = await request.json();
        const { email } = rawLead || {};

        if (!email || typeof email !== "string" || !email.includes("@")) {
          return new Response(JSON.stringify({ status: "error", message: "Valid email address is required." }), { status: 400, headers: corsHeaders });
        }

        const sheetsUrl = (env && env.NOBAGSR_SHEETS_URL) ? env.NOBAGSR_SHEETS_URL : NOBA_GSR_WORKSPACE_SHEETS_URL;
        let sheetSuccess = false;
        let emailSuccess = false;

        try {
          const sheetResp = await fetch(sheetsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            redirect: "follow",
            body: JSON.stringify({ ...rawLead, timestamp: new Date().toISOString() })
          });
          const text = await sheetResp.text();
          const parsed = JSON.parse(text);
          sheetSuccess = sheetResp.ok && (parsed.status === "ok" || parsed.row_added === true);
          if (parsed.email_sent === true) emailSuccess = true;
        } catch(e) {
          console.error("Sheets fetch error:", e);
        }

        // Multi-channel FormSubmit admin alert
        try {
          await fetch("https://formsubmit.co/ajax/thebusinesseutopia@gmail.com", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              _subject: `NOBA Samvad 2026 Subscriber: ${rawLead.name || 'Hatiana Bandhu'} (${rawLead.batch || ''})`,
              ...rawLead
            })
          });
        } catch(fsErr) {}

        return new Response(JSON.stringify({
          status: "success",
          campaign: "noba-gsr-samvad",
          sheet: sheetSuccess,
          email: emailSuccess
        }), { headers: corsHeaders });

      } catch(err) {
        return new Response(JSON.stringify({ status: "error", message: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 2. Clean URL rewrites (redirect /thank-you.html -> /thank-you)
    if (url.pathname === "/thank-you.html") {
      url.pathname = "/thank-you";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === "/highlights.html") {
      url.pathname = "/highlights";
      return Response.redirect(url.toString(), 301);
    }

    // 3. Serve all static assets (HTML, CSS, JS, images, PDF)
    return env.ASSETS.fetch(request);
  }
};
