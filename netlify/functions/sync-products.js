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

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...options.headers
  };
  return fetch(url, { ...options, headers });
}

exports.handler = async (event) => {
  const path = new URL(event.rawUrl, `http://localhost`).searchParams;
  const action = path.get("action");

  // --- DIAGNOSTIC: test Supabase connectivity ---
  if (action === "test") {
    const result = {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY,
      urlPrefix: SUPABASE_URL ? SUPABASE_URL.substring(0, 20) + "..." : "missing",
      keyPrefix: SUPABASE_KEY ? SUPABASE_KEY.substring(0, 8) + "..." : "missing"
    };
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const res = await supabaseFetch("/rest/v1/app_data?key=eq.products&select=value&limit=1");
        result.status = res.status;
        result.statusText = res.statusText;
        if (res.ok) {
          const body = await res.json();
          result.tableExists = true;
          result.rowCount = body.length;
          result.hasData = body.length > 0 && body[0]?.value != null;
        } else {
          const errBody = await res.text();
          result.tableExists = false;
          result.error = errBody;
        }
      } catch (err) {
        result.error = err.message;
        result.networkError = true;
      }
    }
    return { statusCode: 200, body: JSON.stringify(result) };
  }

  // GET — public, no auth required
  if (event.httpMethod === "GET" && !action) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { statusCode: 200, body: JSON.stringify({ source: "local", data: null }) };
    }
    try {
      const res = await supabaseFetch("/rest/v1/app_data?key=eq.products&select=value");
      if (!res.ok) {
        const errBody = await res.text();
        console.error("Supabase GET error:", res.status, errBody);
        return { statusCode: 200, body: JSON.stringify({ source: "local", data: null, error: errBody }) };
      }
      const rows = await res.json();
      const products = rows?.[0]?.value || null;
      console.log("Supabase GET success, products:", products ? products.length + " items" : "null");
      return { statusCode: 200, body: JSON.stringify({ source: "server", data: products }) };
    } catch (err) {
      console.error("Supabase GET exception:", err.message);
      return { statusCode: 200, body: JSON.stringify({ source: "local", data: null, error: err.message }) };
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
      // Delete existing row
      await supabaseFetch("/rest/v1/app_data?key=eq.products", {
        method: "DELETE"
      });

      // Insert fresh row
      const res = await supabaseFetch("/rest/v1/app_data", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ key: "products", value: products })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Supabase POST error:", res.status, errText);
        return { statusCode: 200, body: JSON.stringify({ saved: false, error: errText }) };
      }

      console.log("Supabase POST success");
      return { statusCode: 200, body: JSON.stringify({ saved: true }) };
    } catch (err) {
      console.error("Supabase POST exception:", err.message);
      return { statusCode: 200, body: JSON.stringify({ saved: false, error: err.message }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
