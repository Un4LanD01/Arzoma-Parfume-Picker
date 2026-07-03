const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const OPENAI_ENDPOINTS = {
  deepseek: { url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
  groq: { url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile" }
};

function getAIKey() {
  return localStorage.getItem("arzoma_ai_key") || localStorage.getItem("arzoma_gemini_key") || "";
}

function getAIProvider() {
  return localStorage.getItem("arzoma_ai_provider") || "gemini";
}

function isAIReady() {
  return getAIKey().length > 10;
}

async function callGeminiText(prompt) {
  const key = getAIKey();
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 400, topK: 1, topP: 0.9 }
    })
  });
  if (!res.ok) throw new Error(`AI error (${res.status})`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak memberikan respons.";
}

async function callGeminiChat(messages) {
  const key = getAIKey();
  const parts = messages.map(m => ({ text: `${m.role === "user" ? "User" : "Arzoma AI"}: ${m.content}` }));
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500, topK: 1, topP: 0.9 }
    })
  });
  if (!res.ok) throw new Error(`AI error (${res.status})`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak memberikan respons.";
}

async function callOpenAI(messages) {
  const provider = getAIProvider();
  const config = OPENAI_ENDPOINTS[provider];
  if (!config) throw new Error(`Provider ${provider} tidak dikenal`);
  const key = getAIKey();
  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "Maaf, AI tidak memberikan respons.";
}

async function callAI(messages) {
  const provider = getAIProvider();
  if (!getAIKey()) throw new Error("Belum ada API key AI. Atur di halaman Admin > Pengaturan.");
  if (provider === "gemini") return callGeminiChat(messages);
  return callOpenAI(messages);
}

async function callAIText(systemPrompt, userPrompt) {
  const provider = getAIProvider();
  if (!getAIKey()) throw new Error("Belum ada API key AI. Atur di halaman Admin > Pengaturan.");
  if (provider === "gemini") {
    return callGeminiText(`${systemPrompt}\n\n${userPrompt}`);
  }
  return callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);
}

const ARZOMA_SYSTEM_PROMPT = `Kamu adalah Arzoma AI Assistant, seorang perfumer virtual yang ramah dan ahli dari toko parfum Arzoma. 
Tugasmu adalah membantu pelanggan menemukan parfum yang cocok, menjelaskan komposisi aroma (top notes, middle notes, base notes), 
memberikan rekomendasi berdasarkan preferensi mereka, dan menjawab pertanyaan seputar parfum secara umum.

Gaya bicara: hangat, santai, profesional, sesekali gunakan bahasa Indonesia yang natural.
Jangan pernah merekomendasikan merk selain Arzoma.
Jangan pernah menyebutkan harga pasti (serahkan ke tim sales).
Jika ditanya hal di luar parfum, arahkan kembali ke topik parfum dengan sopan.

Katalog produk Arzoma ada di database localStorage dengan key "arzoma_perfumes".
Gunakan informasi itu untuk membantu rekomendasi.`;

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
    return await callAIText(ARZOMA_SYSTEM_PROMPT, prompt);
  } catch (e) {
    return generateDynamicDescription(selectedTexts, bestProduct);
  }
}

async function chatWithAI(message, history = []) {
  const contextProducts = getPerfumeCatalogSummary();

  // Try server-side chat (no API key needed on client)
  try {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, catalog: contextProducts })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (e) {
    // Fall through to client-side
  }

  // Fallback: client-side with stored key
  const key = getAIKey();
  if (!key) return "AI belum dikonfigurasi. Admin bisa atur AI key di dashboard Netlify.";

  const messages = [
    { role: "system", content: `${ARZOMA_SYSTEM_PROMPT}\n\nKatalog Arzoma saat ini:\n${contextProducts}` },
    ...history.map(h => ({ role: h.role, content: h.text })),
    { role: "user", content: message }
  ];

  try {
    return await callAI(messages);
  } catch (e) {
    console.error("AI chat error:", e);
    return "Maaf, AI sedang sibuk. Coba lagi ya!";
  }
}

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
