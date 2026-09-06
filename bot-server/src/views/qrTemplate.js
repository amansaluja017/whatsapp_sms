function renderConnectedPage(phone) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WhatsApp Bot Connected</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000000; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
          .box { background: #0A0A0A; border: 1px solid #262626; padding: 36px 32px; border-radius: 18px; max-width: 420px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
          .badge { background: #FFFFFF; color: #000000; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 11px; letter-spacing: 0.8px; display: inline-block; margin-bottom: 20px; }
          h2 { margin: 0 0 10px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          p { color: #A1A1AA; font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
          strong { color: #FFFFFF; }
          .hint { font-size: 12px; color: #71717A; margin-top: 18px; border-top: 1px solid #1F1F1F; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="box">
          <span class="badge">● ONLINE</span>
          <h2>WhatsApp Connected</h2>
          <p>Logged in as: <strong>+${phone}</strong></p>
          <p>Your WhatsApp Bot is active and ready to send messages triggered by your mobile app.</p>
          <div class="hint">You can safely close this browser window or return to the mobile app.</div>
        </div>
      </body>
    </html>
  `;
}

function renderInitializingPage() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>WhatsApp Bot - Initializing</title>
        <meta http-equiv="refresh" content="3">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000000; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .box { background: #0A0A0A; border: 1px solid #262626; padding: 36px 32px; border-radius: 18px; max-width: 400px; }
          h2 { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
          p { color: #A1A1AA; font-size: 13px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>Preparing WhatsApp QR Code...</h2>
          <p>Starting background service and synchronizing session. This page will refresh automatically in a few seconds...</p>
        </div>
      </body>
    </html>
  `;
}

function renderQRPage(qrDataUrl) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Link WhatsApp Bot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="20">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #000000; color: #FFFFFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
          .card { background: #0A0A0A; border: 1px solid #262626; padding: 32px 28px; border-radius: 20px; text-align: center; max-width: 420px; width: 100%; box-shadow: 0 12px 36px rgba(0,0,0,0.9); }
          .badge { border: 1px solid #444444; background: #141414; color: #FFFFFF; padding: 5px 12px; border-radius: 20px; font-weight: 700; font-size: 10px; letter-spacing: 0.8px; display: inline-block; margin-bottom: 14px; }
          h2 { margin: 0 0 8px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          p { color: #A1A1AA; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
          .qr-wrapper { background: #FFFFFF; padding: 14px; border-radius: 14px; display: inline-block; box-shadow: 0 6px 20px rgba(255,255,255,0.08); }
          .qr-wrapper img { display: block; border-radius: 4px; }
          ol { text-align: left; font-size: 13px; color: #D4D4D8; margin: 24px 0 0; padding-left: 22px; line-height: 1.8; }
          li strong { color: #FFFFFF; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">○ SCAN QR CODE</span>
          <h2>Link WhatsApp Account</h2>
          <p>Scan this QR code with WhatsApp on your phone to link your bot</p>
          <div class="qr-wrapper">
            <img src="${qrDataUrl}" alt="WhatsApp Pairing QR Code" width="280" height="280" />
          </div>
          <ol>
            <li>Open <strong>WhatsApp</strong> on your mobile device</li>
            <li>Tap <strong>Settings</strong> or <strong>Menu ⋮</strong></li>
            <li>Select <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></li>
            <li>Point your camera at this QR code</li>
          </ol>
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  renderConnectedPage,
  renderInitializingPage,
  renderQRPage,
};
