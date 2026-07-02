const crypto = require("crypto");

const SECRET = process.env.ADMIN_SECRET || "arzoma-default-secret-change-me";

function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, sig] = parts;

    // Verify signature
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
    if (sig !== expectedSig) return null;

    // Parse payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    // Check expiration
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ valid: false }) };
    }

    const payload = verifyToken(token);
    if (payload) {
      return {
        statusCode: 200,
        body: JSON.stringify({ valid: true, username: payload.username })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ valid: false })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ valid: false }) };
  }
};
