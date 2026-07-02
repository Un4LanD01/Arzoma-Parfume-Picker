/**
 * ARZOMA - GEMINI AI INTEGRATION (ai-integration.js)
 * Real AI-powered chat assistant & enhanced descriptions via Google Gemini API.
 */

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Get the stored Gemini API key.
 */
function getGeminiKey() {
  return localStorage.getItem("arzoma_gemini_key") || "";
}

/**
 * Check if Gemini is configured with a valid key.
 */
function isGeminiReady() {
  return localStorage.getItem("arzoma_gemini_key")?.length > 10;
}

/**
 * Call Gemini API with a prompt.
 * @param {string} prompt
 * @returns {Promise<string>} response text
 */
async function callGemini(prompt) {
  const key = getGeminiKey();
  if (!key) throw new Error("Belum ada API key Gemini. Atur di halaman Admin > Pengaturan.");

  const res = await fetch(`${GEMINI_API_ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 400,
        topK: 1,
        topP: 0.9
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak memberikan respons.";
}

/**
 * SYSTEM PROMPT — Arzoma AI Assistant persona
 */
const ARZOMA_SYSTEM_PROMPT = `Kamu adalah Arzoma AI Assistant, seorang perfumer virtual yang ramah dan ahli dari toko parfum Arzoma. 
Tugasmu adalah membantu pelanggan menemukan parfum yang cocok, menjelaskan komposisi aroma (top notes, middle notes, base notes), 
memberikan rekomendasi berdasarkan preferensi mereka, dan menjawab pertanyaan seputar parfum secara umum.

Gaya bicara: hangat, santai, profesional, sesekali gunakan bahasa Indonesia yang natural.
Jangan pernah merekomendasikan merk selain Arzoma.
Jangan pernah menyebutkan harga pasti (serahkan ke tim sales).
Jika ditanya hal di luar parfum, arahkan kembali ke topik parfum dengan sopan.

Katalog produk Arzoma ada di database localStorage dengan key "arzoma_perfumes".
Gunakan informasi itu untuk membantu rekomendasi.`;

/**
 * Generate enhanced AI description for quiz results.
 * @param {string[]} selectedTexts - User's quiz choices
 * @param {Object} bestProduct - Matched product
 * @returns {Promise<string>}
 */
async function generateRealAIDescription(selectedTexts, bestProduct) {
  const mood = selectedTexts[0] || "suasana tertentu";
  const ootd = selectedTexts[1] || "gaya tertentu";
  const cond = selectedTexts[2] || "aktivitas tertentu";

  const topNotes = (bestProduct.topNotes || []).join(", ");
  const midNotes = (bestProduct.middleNotes || []).join(", ");
  const baseNotes = (bestProduct.baseNotes || []).join(", ");

  const prompt = `Kamu adalah perfumer Arzoma. Seorang pelanggan telah selesai mengikuti kuis visual dan mendapatkan rekomendasi parfum.

Mereka memilih:
- Suasana/Mood: ${mood}
- Gaya Pakaian: ${ootd}
- Aktivitas/Kondisi: ${cond}

Parfum yang direkomendasikan: ${bestProduct.name}
Kategori: ${bestProduct.category}
Top Notes: ${topNotes}
Middle Notes: ${midNotes}
Base Notes: ${baseNotes}
Deskripsi produk: ${bestProduct.desc}

Buatlah 2-3 paragraf pendek menjelaskan MENGAPA parfum ini cocok untuk mereka berdasarkan pilihan mereka, 
dan bagaimana aroma ini akan berkembang di kulit (dari top notes ke base notes). 
Gaya bahasa hangat dan personal. Gunakan bahasa Indonesia campuran Inggris sesekali. 
JANGAN sebut harga. JANGAN gunakan markdown/formatting, cukup teks biasa.`;

  try {
    return await callGemini(prompt);
  } catch (e) {
    // Fallback ke template description
    return generateDynamicDescription(selectedTexts, bestProduct);
  }
}

/**
 * Chat with the AI assistant.
 * @param {string} message - User's message
 * @param {Array} history - Previous chat history [{role: "user"|"model", text: string}]
 * @returns {Promise<string>}
 */
async function chatWithAI(message, history = []) {
  const key = getGeminiKey();
  if (!key) return "API key Gemini belum diatur. Admin bisa atur di halaman Admin > Pengaturan.";

  const contextProducts = getPerfumeCatalogSummary();

  const parts = [
    { text: `${ARZOMA_SYSTEM_PROMPT}\n\nKatalog Arzoma saat ini:\n${contextProducts}\n\n---\n` },
    ...history.flatMap(h => [
      { text: h.role === "user" ? `User: ${h.text}` : `Arzoma AI: ${h.text}` }
    ]),
    { text: `User: ${message}\nArzoma AI:` }
  ];

  try {
    const res = await fetch(`${GEMINI_API_ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500, topK: 1, topP: 0.9 }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return `Maaf, AI sedang sibuk. Coba lagi ya! (${res.status})`;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak memberikan respons.";
  } catch (e) {
    return "Maaf, terjadi gangguan koneksi. Coba lagi nanti ya!";
  }
}

/**
 * Build a summary string of all perfumes for AI context.
 */
function getPerfumeCatalogSummary() {
  try {
    const perfumes = JSON.parse(localStorage.getItem("arzoma_perfumes") || "[]");
    return perfumes.slice(0, 30).map(p =>
      `- ${p.name} (${p.category}): Top=${(p.topNotes||[]).join(",")}, Mid=${(p.middleNotes||[]).join(",")}, Base=${(p.baseNotes||[]).join(",")}. ${p.desc}`
    ).join("\n") + (perfumes.length > 30 ? "\n...dan " + (perfumes.length - 30) + " produk lainnya." : "");
  } catch {
    return "Database parfum belum tersedia.";
  }
}
