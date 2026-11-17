// Standalone Cloudflare Pages Function for NOBA Samvad 2026 (/submit)
// Connects directly to NOBA GSR Google Workspace Web App

const NOBA_GSR_WORKSPACE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwEzicoFVKur2alBsuqHpY2SwalZh_7ss4Sq4QU4eTZh_sv5EVYRVMR8TGvLyjnRrIZ/exec";

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const rawLead = await request.json();
    const { name, email, phone } = rawLead || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({
        status: "error",
        message: "Valid email address is required."
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const sheetsUrl = (env && env.NOBAGSR_SHEETS_URL) ? env.NOBAGSR_SHEETS_URL : NOBA_GSR_WORKSPACE_SHEETS_URL;
    let sheetSuccess = false;
    let emailSuccess = false;

    // 1. Post to Google Apps Script (Workspace Edition with 1,500 emails/day capacity)
    try {
      const sheetResponse = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify({
          ...rawLead,
          timestamp: new Date().toISOString()
        })
      });
      const sheetText = await sheetResponse.text();
      try {
        const parsedSheet = JSON.parse(sheetText);
        sheetSuccess = sheetResponse.ok && (parsedSheet.status === 'ok' || parsedSheet.row_added === true);
        if (parsedSheet.email_sent === true) {
          emailSuccess = true;
        }
      } catch (parseErr) {
        sheetSuccess = false;
      }
    } catch (err) {
      console.error('Google Sheets logging error:', err);
    }

    // 2. Dispatch Admin Notification via Resend API (if configured in environment variables)
    const resendKey = env && env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          },
          body: JSON.stringify({
            from: "NOBA GSR Registry <onboarding@resend.dev>",
            to: ["thebusinesseutopia@gmail.com"],
            reply_to: email,
            subject: `[NOBA Samvad 2026 Subscriber] ${name || 'Hatiana Bandhu'} (${rawLead.batch || ''}, ${rawLead.ashram || ''})`,
            html: `<h3>New NOBA Samvad 2026 Subscriber Captured!</h3>
                   <p><strong>Name:</strong> ${name || '-'}</p>
                   <p><strong>Roll No:</strong> ${rawLead.roll_no || '-'}</p>
                   <p><strong>Batch:</strong> ${rawLead.batch || '-'}</p>
                   <p><strong>Ashram:</strong> ${rawLead.ashram || '-'}</p>
                   <p><strong>Edition:</strong> ${rawLead.format || '-'}</p>
                   <p><strong>Email:</strong> ${email || '-'}</p>
                   <p><strong>WhatsApp:</strong> ${phone || '-'}</p>
                   <p><strong>Address:</strong> ${rawLead.address || '-'} (PIN: ${rawLead.pincode || '-'}, ${rawLead.country || 'India'})</p>
                   <p><strong>Profession / Chapter:</strong> ${rawLead.profession || '-'}</p>
                   <p><strong>Contribution:</strong> ${rawLead.contribution || '-'}</p>
                   <p><strong>Consent:</strong> ${rawLead.consent ? 'Yes' : 'No'}</p>`
          })
        });
      } catch (e) {}
    }

    // 3. Multi-Channel Admin Backup via FormSubmit
    try {
      await fetch("https://formsubmit.co/ajax/thebusinesseutopia@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: `NOBA Samvad 2026 Subscriber: ${name || 'Hatiana Bandhu'} (${rawLead.batch || ''})`,
          ...rawLead
        })
      });
    } catch(e) {}

    return new Response(JSON.stringify({
      status: "success",
      campaign: "noba-gsr-samvad",
      sheet: sheetSuccess,
      email: emailSuccess
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Submission failed. Please try again."
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  return onRequest(context);
}

export async function onRequestPost(context) {
  return onRequest(context);
}
