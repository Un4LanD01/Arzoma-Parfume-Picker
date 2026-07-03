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
      generationConfig: { temperature: 0.8, maxOutputTokens: 250, topK: 1, topP: 0.9 }
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 250, topK: 1, topP: 0.9 }
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
      max_tokens: 200
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

const ARZOMA_SYSTEM_PROMPT = `Kamu adalah Arzoma AI Assistant, perfumer virtual.

Contoh jawaban:
User: "cari parfum manis"
AI: Untuk manis, coba ✨ Afnan Supremacy Collector — vanilla dan apel, elegan untuk sehari-hari.

User: "parfum segar buat tropis"
AI: 🔥 Afnan 9pm Night Out — dragon fruit dan lavender, segar tahan panas.

User: "rekomendasi kondangan"
AI: Mewah untuk kondangan, ✨ FA Royal Blend Sequoia — raspberry dan cognac, wangi classy.

ATURAN: Ikuti contoh di atas. Maks 2 kalimat. 1 produk. Jangan tanya balik. Jangan markdown. Jangan sebut harga. Jangan merk lain.

Katalog Arzoma ada di localStorage key "arzoma_perfumes".`;

async function generateRealAIDescription(selectedTexts, bestProduct) {
  const mood = selectedTexts[0] || "suasana tertentu";
  const ootd = selectedTexts[1] || "gaya tertentu";
  const cond = selectedTexts[2] || "aktivitas tertentu";

  const topNotes = (bestProduct.topNotes || []).join(", ");
  const midNotes = (bestProduct.middleNotes || []).join(", ");
  const baseNotes = (bestProduct.baseNotes || []).join(", ");

  const prompt = `Kamu adalah perfumer Arzoma. Pelanggan selesai kuis.

Pilihan: Mood=${mood}, OOTD=${ootd}, Aktivitas=${cond}
Rekomendasi: ${bestProduct.name}
Notes: ${topNotes} | ${midNotes} | ${baseNotes}
Deskripsi: ${bestProduct.desc}

Buat 2 kalimat pendek kenapa parfum ini cocok.
MAKSIMAL 3 baris, pakai emoji.
JANGAN sebut harga. JANGAN markdown.`;

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
