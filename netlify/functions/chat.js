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

const SYSTEM_PROMPT = `Kamu adalah Arzoma AI Assistant, perfumer virtual.

Contoh jawaban yang benar:
User: "cari parfum manis"
AI: Untuk manis, coba ✨ Afnan Supremacy Collector — vanilla dan apel, elegan untuk sehari-hari.

User: "parfum segar buat tropis"
AI: 🔥 Afnan 9pm Night Out — dragon fruit dan lavender, segar dan tahan lama di cuaca panas.

User: "rekomendasi buat kondangan"
AI: Mewah untuk kondangan, ✨ FA Royal Blend Sequoia — raspberry dan cognac, wangi classy.

ATURAN: Ikuti contoh di atas PERSIS. Maksimal 2 kalimat. 1 produk per jawaban. Jangan tanya balik. Jangan markdown. Jangan sebut harga. Jangan rekomendasi merk lain.`;

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

    const fullSystem = `${SYSTEM_PROMPT}\n\nKatalog Arzoma:\n${catalog || "Tidak tersedia"}`;

    const roleMap = { user: "user", model: "assistant", assistant: "assistant" };
    const messages = [
      { role: "system", content: fullSystem },
      ...(history || []).map(h => ({ role: roleMap[h.role] || "user", content: h.text })),
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
        max_tokens: 200
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return { statusCode: 200, body: JSON.stringify({ reply: "Maaf, AI sedang sibuk. Coba lagi ya!" }) };
    }

    const data = await res.json();
    let reply = data?.choices?.[0]?.message?.content || "Maaf, AI tidak memberikan respons.";
    reply = reply.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    const lines = reply.split("\n").filter(Boolean);
    reply = lines.slice(0, 2).join("\n");
    if (reply.length > 250) reply = reply.slice(0, 247) + "...";

    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error("Chat function error:", err.message);
    return { statusCode: 200, body: JSON.stringify({ reply: "Maaf, terjadi gangguan. Coba lagi nanti!" }) };
  }
};
