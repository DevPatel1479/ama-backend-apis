// const { getFirestore } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");

// const db = getFirestore();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendWhatsappOTP(phone, otp) {
  const fetch = (await import("node-fetch")).default;

  // Load WATI credentials from environment
  const apiKey = process.env.WATI_API_KEY;
  const baseUrl = process.env.WATI_BASE_URL || "https://live-mt-server.wati.io";
  const tenantId = process.env.WATI_TENANT_ID || "366071";
  const templateName = process.env.WATI_TEMPLATE_NAME;

  if (!apiKey || !templateName) {
    console.error("Missing WATI API key or template name");
    return;
  }

  let formattedPhone = phone.replace(/\D/g, "");
  console.log("formatted phone  ... ");
  console.log(formattedPhone);
  if (formattedPhone.length === 10) {
    formattedPhone = formattedPhone;
  }

  const url = `${baseUrl}/${tenantId}/api/v1/sendTemplateMessages`;

  const requestBody = {
    template_name: templateName,
    broadcast_name: `OTP_${Date.now()}`,
    receivers: [
      {
        whatsappNumber: formattedPhone,
        customParams: [{ name: "1", value: otp }],
      },
    ],
    channel_number: "", // Optional: if you need a specific channel number
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WATI API Error ${response.status}: ${text}`);
  }

  const result = await response.json();
  console.log("WATI API response:", result);
  return result;
}

async function sendOTP(phone, role) {
  const docId = `91${phone}`;
  const userRef = db.collection("login_users").doc(docId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User not found");
  }

  const otp = generateOTP();
  await userRef.update({ otp });
  await sendWhatsappOTP(phone, otp);

  return otp;
}

async function verifyOTP(phone, role, inputOtp) {
  const docId = `91${phone}`;
  const userRef = db.collection("login_users").doc(docId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User not found");
  }

  const storedOtp = userSnap.data().otp;

  if (storedOtp !== inputOtp) {
    throw new Error("Invalid OTP");
  }

  await userRef.update({ otp: "" });

  return true;
}

module.exports = {
  sendOTP,
  verifyOTP,
};
