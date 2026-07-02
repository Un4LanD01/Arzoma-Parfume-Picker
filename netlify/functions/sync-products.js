const crypto = require("crypto");

const SECRET = process.env.ADMIN_SECRET || "arzoma-default-secret-change-me";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  // GET — public, no auth required (used by public website)
  if (event.httpMethod === "GET") {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 200, body: JSON.stringify({ source: "local", data: null }) };
    }
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data?key=eq.products&select=value`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      const rows = await res.json();
      const products = rows?.[0]?.value || null;
      return { statusCode: 200, body: JSON.stringify({ source: "server", data: products }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch from Supabase" }) };
    }
  }

  // POST — requires admin auth, saves products to Supabase
  if (event.httpMethod === "POST") {
    const { token, products } = JSON.parse(event.body || "{}");
    const payload = verifyToken(token);
    if (!payload) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 200, body: JSON.stringify({ saved: false, reason: "Supabase not configured" }) };
    }

    try {
      // Upsert: if row with key='products' exists, update it; otherwise insert
      const res = await fetch(`${SUPABASE_URL}/rest/v1/app_data`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({ key: "products", value: products })
      });

      if (!res.ok) {
        const errText = await res.text();
        return { statusCode: 500, body: JSON.stringify({ error: errText }) };
      }

      return { statusCode: 200, body: JSON.stringify({ saved: true }) };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
