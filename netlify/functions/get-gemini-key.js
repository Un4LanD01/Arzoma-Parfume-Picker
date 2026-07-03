const crypto = require("crypto");

const SECRET = process.env.ADMIN_SECRET || "arzoma-default-secret-change-me";

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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");
    const payload = verifyToken(token);

    if (!payload) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const provider = process.env.AI_PROVIDER || "gemini";
    const geminiKey = process.env.GEMINI_API_KEY || "";
    const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
    const groqKey = process.env.GROQ_API_KEY || "";

    let key = "";
    if (provider === "deepseek") key = deepseekKey;
    else if (provider === "groq") key = groqKey;
    else key = geminiKey;

    return {
      statusCode: 200,
      body: JSON.stringify({ key, provider })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
