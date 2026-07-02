/**
 * ARZOMA PERFUME PICKER - CORE APPLICATION LOGIC (app.js)
 * Manages UI events, Catalog rendering, local storage integration,
 * Dupe Finder, Admin panel form, and Quiz Analytics.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements Selection
  const header = document.getElementById("main-header");
  const btnStartQuizHero = document.getElementById("btn-start-quiz-hero");
  const btnCloseQuiz = document.getElementById("btn-close-quiz");
  const quizModal = document.getElementById("quiz-modal");
  const quizQuestionContainer = document.getElementById("quiz-question-container");
  const quizProgress = document.getElementById("quiz-progress");
  
  const notesFilterContainer = document.getElementById("notes-filter-container");
  const dupeSearchInput = document.getElementById("dupe-search-input");
  const dupeResultsDropdown = document.getElementById("dupe-results-dropdown");
  const productCatalogGrid = document.getElementById("product-catalog-grid");
  const reviewsGrid = document.getElementById("reviews-grid");
  
  // Analytics (moved to admin page - kept only for quiz tracking)

  // Navigation Links
  const navHome = document.getElementById("nav-home");
  const navQuiz = document.getElementById("nav-quiz");
  const navExplore = document.getElementById("nav-explore");
  const navCatalog = document.getElementById("nav-catalog");
  const navReviews = document.getElementById("nav-reviews");

  // Search
  const catalogSearchInput = document.getElementById("catalog-search-input");

  // Mobile Menu + Backdrop
  const btnMobileMenu = document.getElementById("btn-mobile-menu");
  const navMenu = document.getElementById("nav-menu");
  // Create backdrop element
  const menuBackdrop = document.createElement("div");
  menuBackdrop.className = "mobile-menu-backdrop";
  document.body.appendChild(menuBackdrop);

  function openMobileMenu() {
    navMenu.classList.add("open");
    menuBackdrop.classList.add("active");
    const icon = btnMobileMenu.querySelector("i");
    icon.className = "fa-solid fa-xmark";
    document.body.style.overflow = "hidden";
  }
  function closeMobileMenu() {
    navMenu.classList.remove("open");
    menuBackdrop.classList.remove("active");
    const icon = btnMobileMenu.querySelector("i");
    icon.className = "fa-solid fa-bars";
    document.body.style.overflow = "";
  }

  btnMobileMenu.addEventListener("click", () => {
    if (navMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
  // Close on backdrop tap
  menuBackdrop.addEventListener("click", closeMobileMenu);
  // Close on nav link click
  document.querySelectorAll("#nav-menu a").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });

  // --- DATA INITIALIZATION ---
  let perfumes = [];
  let waNumber = "628123456789";
  let quizAnalytics = {
    totalQuizzes: 0,
    moodSelections: {},
    noteSelections: {},
    recommendationsCount: {}
  };

  // Default Testimonials
  const testimonials = [
    {
      name: "Sabrina Putri",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      stars: 5,
      content: "Iseng nyobain kuis visualnya, ternyata direkomendasiin Arzoma Warm Vanilla. Wanginya nempel seharian, mirip banget sama Black Opium tapi harga sepertiganya aja! Admin WA-nya juga super ramah."
    },
    {
      name: "Rian Hidayat",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80",
      stars: 5,
      content: "Beli Arzoma Signature lewat rekomendasi kuis. Wangi fresh oceanic-nya pas banget buat gua yang sering sepedaan. Temen kantor pada nanyain pake parfum apa."
    },
    {
      name: "Amalia Kartika",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80",
      stars: 5,
      content: "Dupe finder-nya ngebantu banget! Tinggal ketik brand luar, langsung dapet saran Arzoma Rain Forest. Pas nyampe beneran seger piney-earthy gitu, cocok buat kencan kasual."
    }
  ];

  // Initialize DB and Analytics with LocalStorage
  function initData() {
    // WA Number
    const storedWA = localStorage.getItem("arzoma_wa");
    if (storedWA) {
      waNumber = storedWA;
    } else {
      localStorage.setItem("arzoma_wa", waNumber);
    }
    
    // 1. Products
    const storedPerfumes = localStorage.getItem("arzoma_perfumes");
    if (storedPerfumes) {
      perfumes = JSON.parse(storedPerfumes);
    } else {
      perfumes = DEFAULT_PERFUME_DATABASE.map(p => ensureNoteLevels({...p}));
      localStorage.setItem("arzoma_perfumes", JSON.stringify(perfumes));
    }
    // Migrate any products still using flat `notes` only
    perfumes.forEach((p, i) => {
      if (!p.topNotes) {
        ensureNoteLevels(p);
        perfumes[i] = p;
      }
    });

    // 2. Quiz Analytics (with dummy data on first load for stunning UI charts)
    const storedAnalytics = localStorage.getItem("arzoma_analytics");
    if (storedAnalytics) {
      quizAnalytics = JSON.parse(storedAnalytics);
    } else {
      quizAnalytics = {
        totalQuizzes: 48,
        moodSelections: {
          "Pantai Tropis": 15,
          "Kopi Hangat": 18,
          "Hutan Hujan": 7,
          "Pesta Mewah": 8
        },
        noteSelections: {
          "Vanilla": 22,
          "Citrus": 16,
          "Oud": 10,
          "Pine": 8
        },
        recommendationsCount: {
          "Arzoma Warm Vanilla": 20,
          "Arzoma Signature": 14,
          "Arzoma Oud Royale": 8,
          "Arzoma Rain Forest": 6
        }
      };
      localStorage.setItem("arzoma_analytics", JSON.stringify(quizAnalytics));
    }
    
  }

  initData();

  // --- UI RENDERING FUNCTIONS ---

  // Scroll Header Effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Render Product Catalog
  let activeNoteFilter = null;
  let activeSearchQuery = "";

  function getFilteredProducts() {
    let result = perfumes;
    
    // Apply note filter
    if (activeNoteFilter) {
      result = result.filter(p => getAllNotes(p).map(n => n.toLowerCase()).includes(activeNoteFilter.toLowerCase()));
    }
    
    // Apply search
    if (activeSearchQuery.trim()) {
      const q = activeSearchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        getAllNotes(p).some(n => n.toLowerCase().includes(q)) ||
        (p.dupes && p.dupes.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    
    return result;
  }
  
  function renderCatalog() {
    productCatalogGrid.innerHTML = "";
    const filtered = getFilteredProducts();
    
    if (filtered.length === 0) {
      productCatalogGrid.innerHTML = `
        <div class="glass" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">
          <i class="fa-solid fa-face-frown" style="font-size: 40px; color: var(--primary-gold); margin-bottom: 15px;"></i>
          <p>Tidak ada parfum yang cocok dengan pencarian Anda.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(perfume => {
      const card = document.createElement("div");
      card.className = "product-card glass";
      
      const priceFormatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
      }).format(perfume.price);

      // Create WhatsApp order link text
      const waText = encodeURIComponent(`Halo Arzoma, saya tertarik dengan parfum ${perfume.name} (${priceFormatted}). Apakah produk ini ready?`);
      const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

      const topN = (perfume.topNotes || []).join(", ");
      const midN = (perfume.middleNotes || []).join(", ");
      const baseN = (perfume.baseNotes || []).join(", ");

      card.innerHTML = `
        <div class="product-image-container">
          <img src="${perfume.image}" alt="${perfume.name}">
          <span class="product-category-badge">${perfume.category}</span>
        </div>
        <div class="product-info">
          <h3>${perfume.name}</h3>
          <div class="product-notes-levels">
            ${topN ? `<div class="note-level"><span class="note-level-label">Top:</span> ${topN}</div>` : ""}
            ${midN ? `<div class="note-level"><span class="note-level-label">Middle:</span> ${midN}</div>` : ""}
            ${baseN ? `<div class="note-level"><span class="note-level-label">Base:</span> ${baseN}</div>` : ""}
          </div>
          <p class="product-description">${perfume.desc}</p>
          <div class="product-price-wa">
            <span class="product-price">${priceFormatted}</span>
            <a href="${waUrl}" target="_blank" class="btn-wa-order" title="Pesan via WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </div>
      `;
      productCatalogGrid.appendChild(card);
    });
  }

  // Search handler
  catalogSearchInput.addEventListener("input", (e) => {
    activeSearchQuery = e.target.value;
    activeNoteFilter = null;
    document.querySelectorAll(".btn-note-filter").forEach(b => b.classList.remove("active"));
    const btnAll = notesFilterContainer.querySelector(".btn-note-filter");
    if (btnAll) btnAll.classList.add("active");
    renderCatalog();
  });

  // Render Note Filters dynamically based on all notes in database
  function renderNoteFilters() {
    notesFilterContainer.innerHTML = "";
    
    // Extract unique notes from all three levels
    const allNotes = new Set();
    perfumes.forEach(p => getAllNotes(p).forEach(note => allNotes.add(note.trim())));
    
    // Create 'All' Button
    const btnAll = document.createElement("button");
    btnAll.className = `btn-note-filter ${activeNoteFilter === null ? 'active' : ''}`;
    btnAll.textContent = "Semua Aroma";
    btnAll.addEventListener("click", () => {
      activeNoteFilter = null;
      activeSearchQuery = "";
      if (catalogSearchInput) catalogSearchInput.value = "";
      document.querySelectorAll(".btn-note-filter").forEach(b => b.classList.remove("active"));
      btnAll.classList.add("active");
      renderCatalog();
    });
    notesFilterContainer.appendChild(btnAll);

    // Create individual note buttons
    const sortedNotes = Array.from(allNotes).sort();
    sortedNotes.forEach(note => {
      const btn = document.createElement("button");
      btn.className = `btn-note-filter ${activeNoteFilter === note ? 'active' : ''}`;
      btn.textContent = note;
      btn.addEventListener("click", () => {
        activeNoteFilter = note;
        activeSearchQuery = "";
        if (catalogSearchInput) catalogSearchInput.value = "";
        document.querySelectorAll(".btn-note-filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderCatalog();
      });
      notesFilterContainer.appendChild(btn);
    });
  }

  // Render Reviews
  function renderReviews() {
    reviewsGrid.innerHTML = "";
    testimonials.forEach(t => {
      const card = document.createElement("div");
      card.className = "review-card glass";
      
      let starsHtml = "";
      for (let i = 0; i < t.stars; i++) {
        starsHtml += `<i class="fa-solid fa-star"></i>`;
      }
      
      card.innerHTML = `
        <div class="review-header">
          <img src="${t.avatar}" alt="${t.name}" class="review-avatar">
          <div class="review-user-info">
            <h4>${t.name}</h4>
            <div class="review-stars">${starsHtml}</div>
          </div>
        </div>
        <p class="review-content">"${t.content}"</p>
      `;
      reviewsGrid.appendChild(card);
    });
  }

  // --- DUPE FINDER LOGIC ---
  dupeSearchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    dupeResultsDropdown.innerHTML = "";
    
    if (query.length < 2) {
      dupeResultsDropdown.style.display = "none";
      return;
    }

    // Search perfume database for matching international brand references
    const matches = perfumes.filter(p => p.dupes && p.dupes.toLowerCase().includes(query));
    
    if (matches.length === 0) {
      dupeResultsDropdown.innerHTML = `<div class="dupe-result-item" style="color: var(--text-muted);">Tidak ada dupe yang cocok untuk "${e.target.value}"</div>`;
    } else {
      matches.forEach(perfume => {
        const item = document.createElement("div");
        item.className = "dupe-result-item";
        item.innerHTML = `
          <strong>${perfume.dupes}</strong> 
          <span style="color: var(--text-muted); font-size: 11px; margin-left: 10px;">
            &rarr; mirip dengan <span style="color: var(--primary-gold); font-weight:600;">${perfume.name}</span>
          </span>
        `;
        item.addEventListener("click", () => {
          dupeSearchInput.value = perfume.dupes;
          dupeResultsDropdown.style.display = "none";
          // Highlight this product in catalog or filter catalog
          activeNoteFilter = null;
          renderCatalog();
          // Scroll to product grid and filter to it
          const cards = productCatalogGrid.querySelectorAll(".product-card");
          cards.forEach(card => {
            if (card.querySelector("h3").textContent === perfume.name) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.style.borderColor = "var(--primary-gold)";
              card.style.boxShadow = "0 0 25px var(--gold-glow)";
              setTimeout(() => {
                card.style.borderColor = "";
                card.style.boxShadow = "";
              }, 3000);
            }
          });
        });
        dupeResultsDropdown.appendChild(item);
      });
    }
    dupeResultsDropdown.style.display = "block";
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!dupeSearchInput.contains(e.target) && !dupeResultsDropdown.contains(e.target)) {
      dupeResultsDropdown.style.display = "none";
    }
  });

  // --- ADAPTIVE VISUAL QUIZ STATE ---
  let quizAnswers = [];
  let selectedTexts = [];
  let currentStepId = "step1";

  // Trigger modal open
  btnStartQuizHero.addEventListener("click", () => {
    quizAnswers = [];
    selectedTexts = [];
    currentStepId = "step1";
    quizModal.style.display = "flex";
    renderQuizStep();
  });

  btnCloseQuiz.addEventListener("click", () => {
    quizModal.style.display = "none";
  });

  // Render visual quiz step dynamically
  function renderQuizStep() {
    quizQuestionContainer.innerHTML = "";
    
    // 1. Calculate progress
    let progressVal = 25;
    if (currentStepId.startsWith("step2")) {
      progressVal = 60;
    } else if (currentStepId === "step3") {
      progressVal = 85;
    } else if (currentStepId === "results") {
      progressVal = 100;
    }
    quizProgress.style.width = `${progressVal}%`;

    // Handle Results view
    if (currentStepId === "results") {
      renderQuizResults();
      return;
    }

    const stepData = QUIZ_QUESTIONS[currentStepId];
    if (!stepData) return;

    // Build Step HTML
    const titleBlock = document.createElement("div");
    titleBlock.className = "quiz-step-title";
    titleBlock.innerHTML = `
      <h2>${stepData.title}</h2>
      <p>${stepData.subtitle}</p>
    `;
    quizQuestionContainer.appendChild(titleBlock);

    const optionsGrid = document.createElement("div");
    optionsGrid.className = "quiz-options-grid";

    stepData.options.forEach(opt => {
      const card = document.createElement("div");
      card.className = "quiz-option-card glass";
      card.innerHTML = `
        <img src="${opt.image}" alt="${opt.text}">
        <div class="quiz-option-overlay">
          <h3>${opt.text}</h3>
          <p>${opt.subtext}</p>
        </div>
      `;
      card.addEventListener("click", () => {
        // Record tags
        quizAnswers.push(...opt.tags);
        selectedTexts.push(opt.text);
        
        // Progress to next step dynamically (Adaptive branch)
        currentStepId = opt.nextStep;
        
        // Record analytics for the mood selection on Step 1
        if (progressVal === 25) {
          quizAnalytics.moodSelections[opt.text] = (quizAnalytics.moodSelections[opt.text] || 0) + 1;
        }

        renderQuizStep();
      });
      optionsGrid.appendChild(card);
    });
    quizQuestionContainer.appendChild(optionsGrid);
  }

  // Calculate recommendation and display results
  function renderQuizResults() {
    // 1. Calculate scores
    let bestProduct = null;
    let highestScore = -1;
    let scores = [];

    perfumes.forEach(p => {
      const score = calculateMatchScore(quizAnswers, p);
      scores.push({ product: p, score: score });
      if (score > highestScore) {
        highestScore = score;
        bestProduct = p;
      }
    });

    if (!bestProduct) {
      bestProduct = perfumes[0];
      highestScore = 95;
    }

    // 2. Generate dynamic AI text (template first, real AI if available)
    const aiReason = generateDynamicDescription(selectedTexts, bestProduct);
    let useRealAI = isGeminiReady();

    // 3. Save to analytics
    quizAnalytics.totalQuizzes += 1;
    quizAnalytics.recommendationsCount[bestProduct.name] = (quizAnalytics.recommendationsCount[bestProduct.name] || 0) + 1;
    
    // Add primary note of chosen perfume to trending note selections
    const allProductNotes = getAllNotes(bestProduct);
    const mainNote = allProductNotes[0] || "Unknown";
    quizAnalytics.noteSelections[mainNote] = (quizAnalytics.noteSelections[mainNote] || 0) + 1;
    
    localStorage.setItem("arzoma_analytics", JSON.stringify(quizAnalytics));

    // 4. Format price & WA redirect URL
    const priceFormatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(bestProduct.price);

    const waText = encodeURIComponent(`Halo Arzoma, saya baru saja menyelesaikan Kuis Visual AI di website Anda dan mendapatkan kecocokan ${highestScore}% untuk parfum: ${bestProduct.name} (${priceFormatted}).\n\nPenjelasan AI: "${aiReason.replace(/\*\*/g, "")}"\n\nApakah stok parfum ini tersedia?`);
    const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

    // 5. Render results HTML
    quizQuestionContainer.innerHTML = `
      <div class="quiz-step-title">
        <h2 class="gold-text">Hasil Rekomendasi AI</h2>
        <p>Aroma terkurasi yang paling menyatu dengan diri Anda.</p>
      </div>
      <div class="result-container" style="margin-top: 30px;">
        <div class="result-image-wrapper">
          <img src="${bestProduct.image}" alt="${bestProduct.name}">
          <div class="match-badge">${highestScore}% Cocok</div>
        </div>
        <div class="result-details">
          <h3>${bestProduct.name}</h3>
          <span class="product-category-badge" style="position:static; display:inline-block; margin-bottom:10px;">
            ${bestProduct.category}
          </span>
          <div class="result-notes-levels">
            ${(bestProduct.topNotes||[]).length ? `<div class="result-note-group"><span class="note-level-label">Top:</span> ${bestProduct.topNotes.map(n => `<span class="note-tag">${n}</span>`).join("")}</div>` : ""}
            ${(bestProduct.middleNotes||[]).length ? `<div class="result-note-group"><span class="note-level-label">Middle:</span> ${bestProduct.middleNotes.map(n => `<span class="note-tag">${n}</span>`).join("")}</div>` : ""}
            ${(bestProduct.baseNotes||[]).length ? `<div class="result-note-group"><span class="note-level-label">Base:</span> ${bestProduct.baseNotes.map(n => `<span class="note-tag">${n}</span>`).join("")}</div>` : ""}
          </div>
          <div class="ai-reasoning" id="ai-reasoning-text">
            ${aiReason}
            ${useRealAI ? `<div id="ai-loading" style="font-size:12px;color:var(--text-muted);margin-top:8px;"><i class="fa-solid fa-spinner fa-spin"></i> AI sedang menganalisis...</div>` : ""}
          </div>
          <div class="result-actions">
            <a href="${waUrl}" target="_blank" class="btn-primary" style="text-decoration:none;">
              Pesan via WhatsApp <i class="fa-brands fa-whatsapp"></i>
            </a>
            <button class="btn-secondary" id="btn-re-quiz">
              Ulangi Kuis <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-re-quiz").addEventListener("click", () => {
      quizAnswers = [];
      selectedTexts = [];
      currentStepId = "step1";
      renderQuizStep();
    });

    // Real AI enhancement (async, replaces template text)
    if (useRealAI) {
      generateRealAIDescription(selectedTexts, bestProduct).then(realDesc => {
        const el = document.getElementById("ai-reasoning-text");
        const loader = document.getElementById("ai-loading");
        if (el) {
          el.innerHTML = realDesc;
        }
      }).catch(() => {
        const loader = document.getElementById("ai-loading");
        if (loader) loader.remove();
      });
    }
  }



  // Update catalog subtitle with product count
  function updateCatalogCount() {
    const subtitle = document.getElementById("catalog-subtitle");
    const count = perfumes.length;
    const categories = [...new Set(perfumes.map(p => p.category))];
    subtitle.textContent = `${count} varian parfum premium Arzoma dalam ${categories.length} kategori: ${categories.join(", ")}.`;
  }

  // --- AI CHAT WIDGET ---
  const btnChat = document.getElementById("btn-ai-chat");
  const chatPanel = document.getElementById("ai-chat-panel");
  const btnCloseChat = document.getElementById("btn-close-chat");
  const chatMessages = document.getElementById("ai-chat-messages");
  const chatInput = document.getElementById("ai-chat-input");
  const btnSendChat = document.getElementById("btn-send-chat");
  let chatHistory = [];

  btnChat.addEventListener("click", () => {
    chatPanel.classList.toggle("open");
  });
  btnCloseChat.addEventListener("click", () => {
    chatPanel.classList.remove("open");
  });

  function addChatMessage(text, isUser = false) {
    const div = document.createElement("div");
    div.className = `chat-msg ${isUser ? "user-msg" : "ai-msg"}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
  }

  async function handleChatSend() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    chatInput.value = "";
    addChatMessage(msg, true);
    chatHistory.push({ role: "user", text: msg });

    // Show typing indicator
    const typing = addChatMessage("Mengetik...");
    typing.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengetik...';

    const reply = await chatWithAI(msg, chatHistory);
    chatHistory.push({ role: "model", text: reply });
    typing.remove();
    addChatMessage(reply);
  }

  btnSendChat.addEventListener("click", handleChatSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleChatSend();
  });

  // --- INITIAL RENDERING TRIGGER ---
  renderCatalog();
  renderNoteFilters();
  renderReviews();
  updateCatalogCount();
});
