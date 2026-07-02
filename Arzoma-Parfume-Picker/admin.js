/**
 * ARZOMA ADMIN DASHBOARD (admin.js)
 * Handles authentication, product CRUD, analytics, and settings.
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("login-screen");
  const adminDashboard = document.getElementById("admin-dashboard");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const setupHint = document.getElementById("setup-hint");
  const btnLogout = document.getElementById("btn-logout");
  const productForm = document.getElementById("admin-product-form");
  const productsBody = document.getElementById("admin-products-body");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const formTitle = document.getElementById("form-title");
  const waInput = document.getElementById("wa-number-input");
  const btnSaveWA = document.getElementById("btn-save-wa");
  const btnResetAnalytics = document.getElementById("btn-reset-analytics");
  const changePasswordForm = document.getElementById("change-password-form");
  
  // Page navigation
  const navLinks = document.querySelectorAll(".admin-sidebar nav a");
  const pageSections = document.querySelectorAll(".page-section");
  
  let perfumes = [];
  let quizAnalytics = {
    totalQuizzes: 0, moodSelections: {}, noteSelections: {}, recommendationsCount: {}
  };
  let editingId = null;

  // --- AUTH SYSTEM ---
  const AUTH_KEY = "arzoma_admin_auth";

  function isLoggedIn() {
    const data = localStorage.getItem(AUTH_KEY);
    return data && JSON.parse(data).authenticated === true;
  }

  function checkAuth() {
    if (isLoggedIn()) {
      loginScreen.style.display = "none";
      adminDashboard.style.display = "flex";
      initData();
      return true;
    } else {
      loginScreen.style.display = "flex";
      adminDashboard.style.display = "none";
      // Check if this is first setup
      const data = localStorage.getItem(AUTH_KEY);
      if (!data) {
        setupHint.style.display = "block";
        document.querySelector("#login-form button").textContent = "Buat Akun Admin";
      }
      return false;
    }
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const existing = localStorage.getItem(AUTH_KEY);
    
    if (!username || !password) {
      loginError.textContent = "Username dan password wajib diisi.";
      loginError.style.display = "block";
      return;
    }

    if (!existing) {
      // First time: create account
      const authData = {
        authenticated: true,
        username: btoa(username),
        password: btoa(password)
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      loginError.style.display = "none";
      checkAuth();
      return;
    }

    const authData = JSON.parse(existing);
    if (btoa(username) === authData.username && btoa(password) === authData.password) {
      authData.authenticated = true;
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
      loginError.style.display = "none";
      checkAuth();
    } else {
      loginError.textContent = "Username atau password salah.";
      loginError.style.display = "block";
    }
  });

  btnLogout.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
    data.authenticated = false;
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    loginScreen.style.display = "flex";
    adminDashboard.style.display = "none";
    setupHint.style.display = "none";
    document.querySelector("#login-form button").textContent = "Masuk";
  });

  // Change password
  changePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentPw = document.getElementById("current-password").value;
    const newPw = document.getElementById("new-password").value;
    const data = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
    if (btoa(currentPw) !== data.password) {
      alert("Password saat ini salah!");
      return;
    }
    data.password = btoa(newPw);
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    alert("Password berhasil diubah!");
    changePasswordForm.reset();
  });

  // --- DATA INIT ---
  function initData() {
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

    const storedAnalytics = localStorage.getItem("arzoma_analytics");
    quizAnalytics = storedAnalytics ? JSON.parse(storedAnalytics) : {
      totalQuizzes: 48,
      moodSelections: { "Pantai Tropis": 15, "Kopi Hangat": 18, "Hutan Hujan": 7, "Pesta Mewah": 8 },
      noteSelections: { "Vanilla": 22, "Citrus": 16, "Oud": 10, "Pine": 8 },
      recommendationsCount: { "Arzoma Warm Vanilla": 20, "Arzoma Signature": 14, "Arzoma Oud Royale": 8, "Arzoma Rain Forest": 6 }
    };
    if (!storedAnalytics) localStorage.setItem("arzoma_analytics", JSON.stringify(quizAnalytics));

    if (waInput) waInput.value = localStorage.getItem("arzoma_wa") || "628123456789";
    
    renderProductsTable();
    updateAnalyticsView();
  }

  // --- PAGE NAVIGATION ---
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      pageSections.forEach(s => s.classList.remove("active"));
      const page = document.getElementById("page-" + link.dataset.page);
      if (page) page.classList.add("active");
      if (link.dataset.page === "products") renderProductsTable();
      if (link.dataset.page === "analytics") updateAnalyticsView();
    });
  });

  // --- PRODUCT TABLE ---
  function renderProductsTable() {
    productsBody.innerHTML = "";
    perfumes.forEach(p => {
      const priceFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.price);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${p.name}</strong></td>
        <td>${priceFmt}</td>
        <td><span class="badge-category">${p.category}</span></td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span style="color:var(--primary-gold); font-size:10px;">Top:</span> ${(p.topNotes||[]).slice(0,2).join(", ")}<br>
          <span style="color:#b8a070; font-size:10px;">Mid:</span> ${(p.middleNotes||[]).slice(0,2).join(", ")}<br>
          <span style="color:var(--text-muted); font-size:10px;">Base:</span> ${(p.baseNotes||[]).slice(0,2).join(", ")}
        </td>
        <td class="actions">
          <button class="edit-btn" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="delete-btn" data-id="${p.id}" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      `;
      productsBody.appendChild(tr);
    });
    // Bind events
    productsBody.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => loadProduct(btn.dataset.id));
    });
    productsBody.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
    });
  }

  function deleteProduct(id) {
    const p = perfumes.find(x => x.id === id);
    if (!p || !confirm(`Hapus "${p.name}" dari database?`)) return;
    perfumes = perfumes.filter(x => x.id !== id);
    localStorage.setItem("arzoma_perfumes", JSON.stringify(perfumes));
    renderProductsTable();
  }

  function loadProduct(id) {
    const p = perfumes.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    document.getElementById("form-product-id").value = id;
    document.getElementById("prod-name").value = p.name;
    document.getElementById("prod-price").value = p.price;
    document.getElementById("prod-category").value = p.category;
    document.getElementById("prod-top-notes").value = (p.topNotes || []).join(", ");
    document.getElementById("prod-mid-notes").value = (p.middleNotes || []).join(", ");
    document.getElementById("prod-base-notes").value = (p.baseNotes || []).join(", ");
    document.getElementById("prod-moods").value = (p.moods || []).join(", ");
    document.getElementById("prod-ootds").value = (p.ootds || []).join(", ");
    document.getElementById("prod-dupes").value = p.dupes || "";
    document.getElementById("prod-desc").value = p.desc || "";
    document.getElementById("prod-image").value = p.image || "";
    formTitle.textContent = "Edit Produk";
    btnCancelEdit.style.display = "flex";
    // Navigate to form
    document.querySelector('[data-page="add-product"]').click();
  }

  btnCancelEdit.addEventListener("click", () => {
    cancelEdit();
  });

  function cancelEdit() {
    editingId = null;
    productForm.reset();
    document.getElementById("form-product-id").value = "";
    document.getElementById("prod-top-notes").value = "";
    document.getElementById("prod-mid-notes").value = "";
    document.getElementById("prod-base-notes").value = "";
    formTitle.textContent = "Tambah Produk Baru";
    btnCancelEdit.style.display = "none";
  }

  // --- FORM SUBMIT ---
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("prod-name").value;
    const price = parseInt(document.getElementById("prod-price").value);
    const category = document.getElementById("prod-category").value;
    const topNotes = document.getElementById("prod-top-notes").value.split(",").map(s => s.trim());
    const middleNotes = document.getElementById("prod-mid-notes").value.split(",").map(s => s.trim());
    const baseNotes = document.getElementById("prod-base-notes").value.split(",").map(s => s.trim());
    const notes = [...topNotes, ...middleNotes, ...baseNotes];
    const moods = document.getElementById("prod-moods").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const ootds = document.getElementById("prod-ootds").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const dupes = document.getElementById("prod-dupes").value;
    const desc = document.getElementById("prod-desc").value;
    const customImage = document.getElementById("prod-image").value.trim();
    
    const imageMap = {
      Fresh: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80",
      Woody: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80",
      Sweet: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80",
      Floral: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
    };

    const productData = { name, price, category, topNotes, middleNotes, baseNotes, notes, moods, ootds, dupes, desc, image: customImage || imageMap[category] };

    if (editingId) {
      const idx = perfumes.findIndex(p => p.id === editingId);
      if (idx !== -1) {
        perfumes[idx] = { ...perfumes[idx], ...productData };
        localStorage.setItem("arzoma_perfumes", JSON.stringify(perfumes));
        alert(`Produk "${name}" berhasil diperbarui!`);
      }
    } else {
      perfumes.push({
        id: "arz-" + Date.now(), ...productData
      });
      localStorage.setItem("arzoma_perfumes", JSON.stringify(perfumes));
      alert(`Produk "${name}" berhasil ditambahkan!`);
    }
    cancelEdit();
    renderProductsTable();
  });

  // --- WA SAVE ---
  btnSaveWA.addEventListener("click", () => {
    const val = waInput.value.trim();
    if (val) {
      localStorage.setItem("arzoma_wa", val);
      alert("Nomor WhatsApp berhasil disimpan!");
    }
  });

  // --- RESET ---
  btnResetAnalytics.addEventListener("click", () => {
    if (confirm("Reset semua data produk dan analitik ke bawaan pabrik?")) {
      localStorage.removeItem("arzoma_perfumes");
      localStorage.removeItem("arzoma_analytics");
      initData();
      alert("Semua data berhasil di-reset!");
    }
  });

  // --- ANALYTICS ---
  function updateAnalyticsView() {
    document.getElementById("stat-total-quizzes").textContent = quizAnalytics.totalQuizzes;
    let highestRec = 0, mostRecName = "-";
    for (const name in quizAnalytics.recommendationsCount) {
      if (quizAnalytics.recommendationsCount[name] > highestRec) {
        highestRec = quizAnalytics.recommendationsCount[name];
        mostRecName = name;
      }
    }
    document.getElementById("stat-most-matched").textContent = mostRecName;

    const chartBars = document.getElementById("analytics-chart-bars");
    chartBars.innerHTML = "";
    const merged = {};
    for (const m in quizAnalytics.moodSelections) merged[`Mood: ${m}`] = quizAnalytics.moodSelections[m];
    for (const n in quizAnalytics.noteSelections) merged[`Aroma: ${n}`] = quizAnalytics.noteSelections[n];
    const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVal = sorted.length > 0 ? sorted[0][1] : 1;
    sorted.forEach(([label, count]) => {
      const item = document.createElement("div");
      item.className = "chart-bar-item";
      item.innerHTML = `
        <span class="chart-bar-name">${label}</span>
        <div class="chart-bar-outer"><div class="chart-bar-inner" style="width:${(count/maxVal)*100}%"></div></div>
        <span class="chart-bar-value">${count}x</span>
      `;
      chartBars.appendChild(item);
    });
  }

  // --- INIT ---
  checkAuth();
});
