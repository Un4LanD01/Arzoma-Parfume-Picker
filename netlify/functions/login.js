const crypto = require("crypto");

const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";
const SECRET = process.env.ADMIN_SECRET || "arzoma-default-secret-change-me";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function createToken(username) {
  const payload = JSON.stringify({ username, exp: Date.now() + TOKEN_EXPIRY_MS });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, password } = JSON.parse(event.body || "{}");

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Username dan password wajib diisi" }) };
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const token = createToken(username);
      return {
        statusCode: 200,
        body: JSON.stringify({ token })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Username atau password salah" })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
