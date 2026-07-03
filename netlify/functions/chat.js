const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

function getKey() {
  if (AI_PROVIDER === "groq") return GROQ_KEY;
  if (AI_PROVIDER === "deepseek") return DEEPSEEK_KEY;
  return GEMINI_KEY;
}

const SYSTEM_PROMPT = `Kamu adalah Arzoma AI Assistant, seorang perfumer virtual yang ramah dan ahli dari toko parfum Arzoma. 
Tugasmu adalah membantu pelanggan menemukan parfum yang cocok, menjelaskan komposisi aroma (top notes, middle notes, base notes), 
memberikan rekomendasi berdasarkan preferensi mereka, dan menjawab pertanyaan seputar parfum secara umum.

Gaya bicara: hangat, santai, profesional, sesekali gunakan bahasa Indonesia yang natural.
Jangan pernah merekomendasikan merk selain Arzoma.
Jangan pernah menyebutkan harga pasti (serahkan ke tim sales).
Jika ditanya hal di luar parfum, arahkan kembali ke topik parfum dengan sopan.`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { message, history, catalog } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Message required" }) };
    }

    const key = getKey();
    if (!key) {
      return { statusCode: 200, body: JSON.stringify({ reply: "AI tidak dikonfigurasi. Admin perlu set AI_PROVIDER & API key di Netlify." }) };
    }

    const fullSystem = `${SYSTEM_PROMPT}\n\nKatalog Arzoma saat ini:\n${catalog || "Tidak tersedia"}`;

    const messages = [
      { role: "system", content: fullSystem },
      ...(history || []).map(h => ({ role: h.role, content: h.text })),
      { role: "user", content: message }
    ];

    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return { statusCode: 200, body: JSON.stringify({ reply: "Maaf, AI sedang sibuk. Coba lagi ya!" }) };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Maaf, AI tidak memberikan respons.";

    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error("Chat function error:", err.message);
    return { statusCode: 200, body: JSON.stringify({ reply: "Maaf, terjadi gangguan. Coba lagi nanti!" }) };
  }
};
