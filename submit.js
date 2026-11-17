// Subscription & Registry Handler for NOBA GSR | NOBA Samvad 2026
// Campaign: noba-gsr-samvad
// Standalone Google Sheet setup: tools/google_apps_script_noba_gsr.js

// Deployed NOBA GSR Google Apps Script Web App URL (/exec) - Workspace Edition
const NOBA_GSR_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwEzicoFVKur2alBsuqHpY2SwalZh_7ss4Sq4QU4eTZh_sv5EVYRVMR8TGvLyjnRrIZ/exec";

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('optin-form');
  if (!form) return;

  form.addEventListener('submit', handleNobaSubscription);
});

function showFormError(message, focusEl) {
  const banner = document.getElementById('form-error-banner');
  if (banner) {
    banner.textContent = message;
    banner.style.display = 'block';
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    alert(message);
  }
  if (focusEl && typeof focusEl.focus === 'function') {
    focusEl.focus();
  }
}

function clearFormError() {
  const banner = document.getElementById('form-error-banner');
  if (banner) {
    banner.textContent = '';
    banner.style.display = 'none';
  }
}

async function handleNobaSubscription(e) {
  e.preventDefault();
  clearFormError();

  const submitBtn = document.getElementById('submit-btn');
  const nameInput = document.getElementById('lead-name');
  const rollInput = document.getElementById('lead-roll');
  const batchInput = document.getElementById('lead-batch');
  const ashramSelect = document.getElementById('lead-ashram');
  const ashramOtherInput = document.getElementById('lead-ashram-other');
  const formatSelect = document.getElementById('lead-format');
  const emailInput = document.getElementById('lead-email');
  const phoneInput = document.getElementById('lead-phone');
  const countrySelect = document.getElementById('lead-country');
  const pincodeInput = document.getElementById('lead-pincode');
  const addressInput = document.getElementById('lead-address');
  const professionInput = document.getElementById('lead-profession');
  const contributionSelect = document.getElementById('lead-contribution');
  const consentCheckbox = document.getElementById('lead-consent');

  const name = nameInput ? nameInput.value.trim() : '';
  const rollNo = rollInput ? rollInput.value.trim() : '';
  const batch = batchInput ? batchInput.value.trim() : '';
  const ashramRaw = ashramSelect ? ashramSelect.value.trim() : '';
  const ashramOther = ashramOtherInput ? ashramOtherInput.value.trim() : '';
  const ashram = ashramRaw === 'Other' ? ashramOther : ashramRaw;
  const format = formatSelect ? formatSelect.value.trim() : 'Print + Digital Copy (Free)';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const country = countrySelect ? countrySelect.value.trim() : 'India';
  const pincode = pincodeInput ? pincodeInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';
  const profession = professionInput ? professionInput.value.trim() : '';
  const contribution = contributionSelect ? contributionSelect.value.trim() : '';
  const consent = Boolean(consentCheckbox && consentCheckbox.checked);

  // Validation
  if (!name) {
    return showFormError('Please enter your Full Name.', nameInput);
  }
  if (!rollNo) {
    return showFormError('Please enter your Netarhat Roll No.', rollInput);
  }
  if (!batch) {
    return showFormError('Please enter your Netarhat Entry Batch (e.g. 1990 or 1990-94).', batchInput);
  }
  if (!ashram) {
    return showFormError('Please select or enter your Ashram.', ashramRaw === 'Other' ? ashramOtherInput : ashramSelect);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return showFormError('Please enter a valid Email Address for digital edition delivery.', emailInput);
  }

  const phoneClean = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^\+?[0-9]{8,16}$/;
  if (!phoneClean || !phoneRegex.test(phoneClean)) {
    return showFormError('Please enter a valid WhatsApp Number (at least 8 digits, include country code if outside India).', phoneInput);
  }

  if (!pincode) {
    return showFormError('Please enter your Pin / ZIP Code.', pincodeInput);
  }
  if (!address || address.length < 8) {
    return showFormError('Please enter your Complete Postal Address for physical magazine delivery.', addressInput);
  }
  if (!consent) {
    return showFormError('Please check the NOBA GSR consent box to confirm your subscription and participation.', consentCheckbox);
  }

  // Loading state
  const originalHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Confirming Subscription &amp; Saving Record...</span>';
  }

  const payload = {
    name: name,
    roll_no: rollNo,
    batch: batch,
    ashram: ashram,
    format: format,
    email: email,
    phone: phone,
    country: country,
    pincode: pincode,
    address: address,
    profession: profession,
    contribution: contribution,
    consent: true,
    campaign: 'noba-gsr-samvad',
    coach: 'NOBA GSR Editorial Desk',
    lead_magnet: 'NOBA Samvad 2026 Annual Edition',
    source_url: window.location.href,
    timestamp: new Date().toISOString()
  };

  let dispatchCompleted = false;

  try {
    // 1. Primary Dispatch: Cloudflare Pages Function (/submit)
    // Handles standalone Google Sheet logging (no duplicate rows), Resend confirmation email, and admin backup.
    try {
      const cfResponse = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (cfResponse.ok) {
        const result = await cfResponse.json();
        if (result && result.status === 'success') {
          dispatchCompleted = true;
        }
      }
    } catch (cfErr) {
      console.warn('Primary /submit endpoint notice:', cfErr);
    }

    // 2. Fallback Direct Dispatch: Standalone NOBA GSR Google Sheet Webhook
    // Runs only if /submit did not complete (e.g., static preview outside Cloudflare Pages)
    if (!dispatchCompleted && NOBA_GSR_SHEET_WEBHOOK_URL && NOBA_GSR_SHEET_WEBHOOK_URL.startsWith('https://')) {
      try {
        await fetch(NOBA_GSR_SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        dispatchCompleted = true;
      } catch (sheetErr) {
        console.warn('Standalone NOBA GSR Google Sheet notice:', sheetErr);
      }
    }

    if (!dispatchCompleted) {
      throw new Error('Unable to reach the subscription server. Please check your connection and try again.');
    }

    try {
      localStorage.setItem('noba_samvad_subscriber', JSON.stringify(payload));
    } catch (storageErr) {}

    window.location.href = 'thank-you.html';
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    const errMsg = (err && err.message) ? err.message : 'Submission failed due to a network error. Please try again.';
    showFormError(errMsg);
    alert(errMsg);
  }
}
