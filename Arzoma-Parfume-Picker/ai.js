/**
 * ARZOMA PERFUME PICKER - AI & RECOMMENDATION ENGINE (ai.js)
 * Handles adaptive quiz steps, match scoring, dupe finder data,
 * and dynamic AI explanation generation.
 */

/**
 * Splits a flat notes array into top, middle, and base notes.
 * @param {string[]} notes - Flat array of note names
 * @returns {{ topNotes: string[], middleNotes: string[], baseNotes: string[] }}
 */
function splitNotesArray(notes) {
  const len = notes.length;
  if (len === 0) return { topNotes: [], middleNotes: [], baseNotes: [] };
  if (len === 1) return { topNotes: [notes[0]], middleNotes: [], baseNotes: [] };
  if (len === 2) return { topNotes: [notes[0]], middleNotes: [], baseNotes: [notes[1]] };
  // 3+ notes: split into ~equal thirds
  const third = Math.ceil(len / 3);
  return {
    topNotes: notes.slice(0, third),
    middleNotes: notes.slice(third, 2 * third),
    baseNotes: notes.slice(2 * third)
  };
}

/**
 * Ensures a product object has topNotes, middleNotes, baseNotes fields.
 * If missing, derives them from the flat `notes` array.
 * @param {Object} product
 * @returns {Object} product with topNotes/middleNotes/baseNotes
 */
function ensureNoteLevels(product) {
  if (product.topNotes) return product; // already migrated
  const { topNotes, middleNotes, baseNotes } = splitNotesArray(product.notes || []);
  product.topNotes = topNotes;
  product.middleNotes = middleNotes;
  product.baseNotes = baseNotes;
  return product;
}

/**
 * Returns all notes from a product across all three levels.
 */
function getAllNotes(product) {
  return [...(product.topNotes || []), ...(product.middleNotes || []), ...(product.baseNotes || [])];
}

// Global constant definition for default perfume database (113 products)
const DEFAULT_PERFUME_DATABASE = [
  {
    id: "arz-sig",
    name: "Arzoma Signature",
    price: 185000,
    category: "Fresh",
    notes: ["Citrus", "Oceanic", "Bergamot", "Cedarwood"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "Sauvage, Acqua Di Gio",
    desc: "Aroma segar samudra dipadukan dengan citrus bergamot yang memberikan energi instan. Sangat cocok untuk aktivitas luar ruangan maupun gaya hidup aktif.",
    image: "assets/arzoma_signature.png"
  },
  {
    id: "arz-oud",
    name: "Arzoma Oud Royale",
    price: 245000,
    category: "Woody",
    notes: ["Oud", "Sandalwood", "Amber", "Leather"],
    moods: ["mewah", "pesta mewah", "kopi hangat", "hutan"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "Oud Wood, Layton",
    desc: "Racikan oud premium dengan sentuhan kulit dan kehangatan amber. Memberikan kesan karismatik, matang, dan sangat berkelas untuk malam hari atau acara penting.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-flo",
    name: "Arzoma Flora Breeze",
    price: 175000,
    category: "Floral",
    notes: ["Rose", "Jasmine", "Peony", "White Musk"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "Miss Dior, Bloom",
    desc: "Buketan bunga mawar dan melati yang manis dan lembut dengan dasar white musk. Memberikan aura feminin yang elegan, romantis, dan menenangkan.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-van",
    name: "Arzoma Warm Vanilla",
    price: 195000,
    category: "Sweet",
    notes: ["Vanilla Bean", "Coffee", "Praline", "Tonka Bean"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "Black Opium, Baccarat Rouge 540",
    desc: "Aroma gourmet manis vanilla dan kopi yang menggoda selera. Cocok untuk Anda yang menyukai perhatian, memberikan kesan hangat, manis, dan misterius.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-rain",
    name: "Arzoma Rain Forest",
    price: 190000,
    category: "Woody",
    notes: ["Pine", "Oakmoss", "Vetiver", "Patchouli"],
    moods: ["hutan", "alam", "segar", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "Terre D'Hermes, Green Irish Tweed",
    desc: "Earthy, green, dan segar seperti udara hutan setelah hujan deras. Varian ini membawa ketenangan alam liar langsung ke kulit Anda dengan ketahanan luar biasa.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-1",
    name: "Afnan 9pm Night Out 100ml",
    price: 540000,
    category: "Fresh",
    notes: ["Dragon fruit", "Bergamot", "Cognac", "Lavender", "Apple", "Cardamom", "Mahonial", "Suede"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["glamour night", "executive formal"],
    dupes: "",
    desc: "Kesegaran Dragon fruit, Bergamot, Cognac, Lavender memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-2",
    name: "Afnan Rare Reef 100ml",
    price: 450000,
    category: "Fresh",
    notes: ["Blackcurrant", "Jeruk", "Orange", "Sitron", "Mint", "Ketumbar", "Coriander", "dan Grapefruit"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Blackcurrant, Jeruk, Orange, Sitron memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-3",
    name: "Afnan SNOI 100ml",
    price: 600000,
    category: "Woody",
    notes: ["Bergamot", "Apel", "dan Blackcurrant", "Oakmoss", "Patchouli", "Nilam", "dan Lavender", "Ambergris"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Bergamot, Apel, dan Blackcurrant, Oakmoss memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-4",
    name: "Afnan Supremacy Collector 100ml",
    price: 585000,
    category: "Floral",
    notes: ["Apel", "Kayu Manis", "Lavender liar", "Bergamot", "Bunga Jeruk", "Lily-of-the-valley", "Vanili", "Tonka bean"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Apel, Kayu Manis, Lavender liar, Bergamot yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-5",
    name: "Afnan Turathi Electric 100ml",
    price: 450000,
    category: "Fresh",
    notes: ["Bergamot", "Grapefruit Pink", "Pear", "Mandarin Orange", "Apel", "Cedarwood", "Bunga Jeruk", "Vanila"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Grapefruit Pink, Pear, Mandarin Orange memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-6",
    name: "Ahmed Al Maghribi Rose Noir 75ml",
    price: 550000,
    category: "Sweet",
    notes: ["Mawar", "Raspberry", "Bunga putih", "Vanilla", "Sentuhan bedak", "powdery", "Ambroxan", "Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Mawar, Raspberry, Bunga putih, Vanilla menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-7",
    name: "Amthra November Rain 50ml",
    price: 225000,
    category: "Woody",
    notes: ["Green Notes", "Bergamot", "Pink Pepper", "Rain Notes", "Watery Notes", "Jasmine", "Pine Tree", "Moss"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Green Notes, Bergamot, Pink Pepper, Rain Notes memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-8",
    name: "Amthra Soaphisticated 50ml",
    price: 225000,
    category: "Fresh",
    notes: ["Aldehydic", "Orange", "Cypress", "Pink Peppercorn", "Orange Flower", "White Flower", "Musk", "Cedarwood"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Aldehydic, Orange, Cypress, Pink Peppercorn memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-9",
    name: "Amthra Tea Amo 50ml",
    price: 225000,
    category: "Floral",
    notes: ["White Tea", "Jasmine", "Cempaka", "Musk", "Amber", "Soft Wood"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga White Tea, Jasmine, Cempaka, Musk yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-10",
    name: "Amthra Wine I'm With You 50ml",
    price: 225000,
    category: "Woody",
    notes: ["Blackcurrant", "Pink Pepper", "Bergamot", "Rose", "Geranium", "Patchouli", "Moss", "Vetiver"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Blackcurrant, Pink Pepper, Bergamot, Rose memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-11",
    name: "BSP Blue Point For Her 100ml",
    price: 276000,
    category: "Fresh",
    notes: ["Citrus", "Bergamot", "Rose", "Jasmine", "Musk", "Amber"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Citrus, Bergamot, Rose, Jasmine memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-12",
    name: "BSP Blue Point For Him 100ml",
    price: 276000,
    category: "Fresh",
    notes: ["Citrus", "Fruity", "Oceanic", "Flowery", "Warm Spicy", "Musky", "Woody"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Citrus, Fruity, Oceanic, Flowery memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-13",
    name: "BSP Papan Selancar EDP 100ml",
    price: 276000,
    category: "Sweet",
    notes: ["Hazelnut", "Bergamot", "Vanilla", "Honey", "Nutty", "Patchouli"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Hazelnut, Bergamot, Vanilla, Honey menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-14",
    name: "BSP Papan Selancar For Her 100ml",
    price: 276000,
    category: "Sweet",
    notes: ["Strawberry Candy", "Permen Stroberi", "Soursop", "Sirsak"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Strawberry Candy, Permen Stroberi, Soursop, Sirsak menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-15",
    name: "BSP The Ubud 3 100ml",
    price: 285000,
    category: "Woody",
    notes: ["Nanas segar", "Fresh Pineapple", "Spicy Saffron", "Sentuhan manis dan kayu", "sweet and woody"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Nanas segar, Fresh Pineapple, Spicy Saffron, Sentuhan manis dan kayu memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-16",
    name: "FA Liquid Brun 100ml",
    price: 480000,
    category: "Fresh",
    notes: ["Kayu Manis", "Cinnamon", "Bunga Jeruk", "Orange Blossom", "Kapulaga", "Cardamom", "dan Bergamot", "Rempah-rempah eksotis dan aroma floral yang lembut"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Kayu Manis, Cinnamon, Bunga Jeruk, Orange Blossom memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-17",
    name: "FA Obsidian 100ml",
    price: 480000,
    category: "Fresh",
    notes: ["Aldehydes", "Jeruk Bali", "Grapefruit", "Bergamot", "Mur", "Myrrh", "Labdanum", "Melati"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Aldehydes, Jeruk Bali, Grapefruit, Bergamot memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-18",
    name: "FA Royal Blend Seqouia 100ml",
    price: 480000,
    category: "Sweet",
    notes: ["Raspberry", "Liquor", "dan Cognac", "Rose dan Moss", "Praline", "Oak", "dan Sandalwood"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Raspberry, Liquor, dan Cognac, Rose dan Moss menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-19",
    name: "FA Vulcan Feu EDP 100ml",
    price: 480000,
    category: "Fresh",
    notes: ["Mango", "Lemon", "Ginger", "Rhubarb", "Jasmine", "Pink Pepper", "Violet", "Praline"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Mango, Lemon, Ginger, Rhubarb memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-20",
    name: "Fordive 1970 100ml",
    price: 297000,
    category: "Fresh",
    notes: ["Pink Pepper", "Juniper", "Violet", "Grapefruit", "Cinnamon", "Sage", "Vanilla", "Amber"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Pink Pepper, Juniper, Violet, Grapefruit memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-21",
    name: "Fordive Atlantis 100ml",
    price: 270000,
    category: "Fresh",
    notes: ["Grapefruit", "blackcurrant", "dan sea salt", "bunga jasmine dan lily of the valley", "pine", "Amber dan praline"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Grapefruit, blackcurrant, dan sea salt, bunga jasmine dan lily of the valley memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-22",
    name: "Fordive Feeling Good 100ml",
    price: 270000,
    category: "Sweet",
    notes: ["Raspberry dan Peony", "Candy dan sentuhan Ambery", "Praline", "Musk", "dan floral notes"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Raspberry dan Peony, Candy dan sentuhan Ambery, Praline, Musk menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-23",
    name: "Fordive Garden Breeze 100ml",
    price: 270000,
    category: "Floral",
    notes: ["Greentea Flower", "Peony", "Apple", "Honeysuckle", "Ylang-ylang", "Garden Rose", "Pink Pepper", "White Musk"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Greentea Flower, Peony, Apple, Honeysuckle yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-24",
    name: "Fordive Revolt 100ml",
    price: 297000,
    category: "Woody",
    notes: ["Sage", "Green Tea", "Orange", "Vetiver", "Moss", "White Lotus", "Amber", "Geranium"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Sage, Green Tea, Orange, Vetiver memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-25",
    name: "Fordive Royal 100ml",
    price: 297000,
    category: "Woody",
    notes: ["Nanas", "Pineapple", "dan Mint", "Dupa", "Incense", "Jintan", "Cumin", "dan Melati"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Nanas, Pineapple, dan Mint, Dupa memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-26",
    name: "Fordive Shelby 100ml",
    price: 297000,
    category: "Woody",
    notes: ["Sage", "Grapefruit", "dan Quince", "Lily of the Valley", "Iris", "dan Sandalwood", "Amber", "Sandalwood"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Sage, Grapefruit, dan Quince, Lily of the Valley memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-27",
    name: "FW Suits Edp 100ml",
    price: 220000,
    category: "Floral",
    notes: ["Violet leaf", "Coriander", "Bergamot", "Rose", "Black pepper", "Lily-of-the-valley", "Patchouli", "Ambergris"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Violet leaf, Coriander, Bergamot, Rose yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-28",
    name: "FW UR Way Intense Edp 100ml",
    price: 220000,
    category: "Floral",
    notes: ["Orange Blossom dan Bergamot", "Tuberose", "sedap malam", "dan Indian Jasmine", ": Madagascar Vanilla dan Sandalwood"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Buketan bunga Orange Blossom dan Bergamot, Tuberose, sedap malam, dan Indian Jasmine yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-29",
    name: "FW UR Way Parfum Edp 100ml [NEW]",
    price: 220000,
    category: "Floral",
    notes: ["Orange Blossom dan Bergamot", "Tuberose", "sedap malam", "dan Indian Jasmine", "White Musk", "Madagascar Vanilla", "dan Virginian Cedar"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Orange Blossom dan Bergamot, Tuberose, sedap malam, dan Indian Jasmine yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-30",
    name: "HMNS Darker Shade Of ORGSM",
    price: 365000,
    category: "Woody",
    notes: ["Orange Blossom", "Red Apple", "Pepper", "Cypriol", "Nagarmota", "Caramel", "Patchouli", "Vanilla Beans"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Orange Blossom, Red Apple, Pepper, Cypriol memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-32",
    name: "HMNS Farhampton 100ml",
    price: 365000,
    category: "Woody",
    notes: ["Bergamot dan ripe fruit", "Lavender dan orange blosso", "Labdanum", "amber", "cedar wood", "dan tonka bea"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Bergamot dan ripe fruit, Lavender dan orange blosso, Labdanum, amber memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-33",
    name: "HMNS ORGSM 100ml",
    price: 320000,
    category: "Floral",
    notes: ["Red Apple", "Rose", "Jasmine", "Peony", "Amber & Vanilla Beans"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Red Apple, Rose, Jasmine, Peony yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-34",
    name: "HMNS Philea 100ml",
    price: 360000,
    category: "Floral",
    notes: ["Bergamot", "Magnolia", "dan Coriander Seed", "Jasmine Sambac", "Mimosa Absolute", "dan Orange Blossom", "Cashmeran", "Heliotrope"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Bergamot, Magnolia, dan Coriander Seed, Jasmine Sambac yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-35",
    name: "HMNS SORE Eterna 100ml",
    price: 365000,
    category: "Fresh",
    notes: ["Bergamot", "Orange", "dan Petit Grain", "Ylang-ylang", "Rose", "dan Peach", "Cedarwood", "Musk"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Orange, dan Petit Grain, Ylang-ylang memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-36",
    name: "HMNS Melting Templation 100ml",
    price: 365000,
    category: "Sweet",
    notes: ["Karamel", "Pear", "Pir", "Apel", "Cocoa", "Cokelat", "Amber", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Karamel, Pear, Pir, Apel menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-37",
    name: "Khadlaj Island Dreams 100ml",
    price: 330000,
    category: "Fresh",
    notes: ["Bergamot", "Ginger", "Grapefruit Accord", "Ambroxan", "Musk"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Ginger, Grapefruit Accord, Ambroxan memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-38",
    name: "Khadlaj Island EXDP 100ml",
    price: 330000,
    category: "Woody",
    notes: ["Nanas", "iris", "jahe", "dan cypress", "Kelapa dan sentuhan kayu", "Tonka bean", "cendana", "sandalwood"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Nanas, iris, jahe, dan cypress memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-39",
    name: "Khadlaj Shiyaaka Snow Edp 100ml",
    price: 340000,
    category: "Fresh",
    notes: ["Jeruk mandarin", "citrus", "dan bergamot", "Neroli", "pala", "nutmeg", "dan pink pepper", "Vetiver Indonesia dan kapulaga"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Jeruk mandarin, citrus, dan bergamot, Neroli memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-40",
    name: "Mandalika Gorgous Tuberose 110ml",
    price: 590000,
    category: "Floral",
    notes: ["Jeruk Mandarin", "Bergamot", "Red Berries", "Melati", "Sedap Malam", "Tuberose", "Bunga Jeruk", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Jeruk Mandarin, Bergamot, Red Berries, Melati yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-41",
    name: "Mandalika Holy Sweet 110ml",
    price: 590000,
    category: "Sweet",
    notes: ["Raspberry", "Strawberry", "Cherry", "Melati", "Violet", "Musk", "Amber", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Raspberry, Strawberry, Cherry, Melati menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-42",
    name: "Mandalika NO.1 100ml",
    price: 590000,
    category: "Woody",
    notes: ["Bergamot", "Ginger", "Jahe", "Sage", "Violet", "Amber", "Cedarwood", "Musk"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Bergamot, Ginger, Jahe, Sage memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-43",
    name: "Mandalika Only The Brave 100ml",
    price: 590000,
    category: "Woody",
    notes: ["Tembakau dan kapulaga", "Kayu cedar dan kayu cendana", "Vanila dan musk"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Tembakau dan kapulaga, Kayu cedar dan kayu cendana, Vanila dan musk memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-44",
    name: "Mandalika Only The Brave 120ml",
    price: 620000,
    category: "Woody",
    notes: ["Tembakau dan kapulaga", "Kayu cedar dan kayu cendana", "Vanila dan musk"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Tembakau dan kapulaga, Kayu cedar dan kayu cendana, Vanila dan musk memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-45",
    name: "Mykonos Café Drops 50ml",
    price: 185000,
    category: "Floral",
    notes: ["Orchid", "Jasmine", "Kopi", "Vanila", "Karamel", "Tonka Bean", "Susu", "Amber"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Orchid, Jasmine, Kopi, Vanila yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-46",
    name: "Mykonos Dark Secret 15ml",
    price: 85000,
    category: "Fresh",
    notes: ["Black cherry", "ceri hitam", "saffron", "bergamot", "Cinnamon", "kayu manis", "nutmeg", "pala"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Black cherry, ceri hitam, saffron, bergamot memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-47",
    name: "Mykonos Milk Drops 50ml",
    price: 185000,
    category: "Sweet",
    notes: ["Floral Bouquet", "Milk", "Green", "Tonka Bean", "White Musk", "White Wood"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Floral Bouquet, Milk, Green, Tonka Bean menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-48",
    name: "Mykonos Moroccan Vanilla 100ml",
    price: 250000,
    category: "Sweet",
    notes: ["Moroccan Vanilla", "Bulgarian Rose", "Rose", "Lemon", "Vanilla", "Sugar", "White Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Moroccan Vanilla, Bulgarian Rose, Rose, Lemon menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-49",
    name: "Mykonos On The Rocks 15ml",
    price: 85000,
    category: "Fresh",
    notes: ["Bergamot", "Apel", "Mur", "Myrrh", "Bunga Jeruk", "Orange Blossom", "Vanili", "Ambroxan"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Apel, Mur, Myrrh memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-50",
    name: "Mykonos Pink Drops 50ml",
    price: 210000,
    category: "Sweet",
    notes: ["Strawberry Preserve", "Almond", "Caramel", "Milk", "Heliotrope", "Vanilla", "White Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Strawberry Preserve, Almond, Caramel, Milk menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-51",
    name: "Mykonos Satin Blanc 15ml",
    price: 85000,
    category: "Fresh",
    notes: ["Bergamot", "Black Pepper", "Green Apple", "Cedar Wood", "Jasmine Tea", "Floral Bouquet", "Aquatic", "White Amber"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Black Pepper, Green Apple, Cedar Wood memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-52",
    name: "Mykonos When in paris 50ml",
    price: 150000,
    category: "Sweet",
    notes: ["Mandarin Orange", "Lychee", "Marigold", "Wild Orchid", "Vanilla Orchid", "Magnolia", "Apricot", "Cashmere Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Mandarin Orange, Lychee, Marigold, Wild Orchid menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-53",
    name: "Mykonos Enchanted 100ml",
    price: 350000,
    category: "Floral",
    notes: ["Mandarin Orange", "Peony", "Rose", "Violet", "Peach", "Iris", "Musk"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Mandarin Orange, Peony, Rose, Violet yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-54",
    name: "Mykonos Satin Blanc 100ml",
    price: 350000,
    category: "Fresh",
    notes: ["Bergamot", "Black Pepper", "Green Apple", "Cedar Wood", "Jasmine Tea", "Floral Bouquet", "Aquatic Notes", "White Amber"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Black Pepper, Green Apple, Cedar Wood memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-55",
    name: "Mykonos Utopia 100ml",
    price: 350000,
    category: "Floral",
    notes: ["Calabrian Bergamot", "White Tea", "Fruits", "Citrus", "Iris", "Jasmine Sambac", "Ylang-Ylang", "Cedarwood"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Calabrian Bergamot, White Tea, Fruits, Citrus yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-56",
    name: "Octarine Blue Motion 50ml",
    price: 60000,
    category: "Fresh",
    notes: ["Fresh citrus and lavender", "including Bergamot", "Lemon", "and Mandarin", "Aromatic and fresh spicy notes", "Ambroxan", "Cedar", "and Labdanum"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Fresh citrus and lavender, including Bergamot, Lemon, and Mandarin memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-57",
    name: "Octarine Boujee Fluff SE",
    price: 75000,
    category: "Sweet",
    notes: ["Lemon", "Strawberry", "Apple", "Freesia", "Coconut", "Marshmallow", "Orange Blossom", "Whipped Cream"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Lemon, Strawberry, Apple, Freesia menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-58",
    name: "Octarine Elixir Homme SE",
    price: 75000,
    category: "Woody",
    notes: ["Cardamom", "Kapulaga", "Lavender", "Mint", "Vanilla", "Sandalwood", "Kayu Cendana", "Benzoin"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Cardamom, Kapulaga, Lavender, Mint memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-59",
    name: "Octarine Elixir One SE",
    price: 75000,
    category: "Fresh",
    notes: ["Aroma buah yang fresh dan manis alami dari Asian pear", "Sentuhan lembut dari bunga Damask rose", "Kehangatan yang memikat dari vanilla dan tonka bean"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Aroma buah yang fresh dan manis alami dari Asian pear, Sentuhan lembut dari bunga Damask rose, Kehangatan yang memikat dari vanilla dan tonka bean memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-60",
    name: "Octarine Noctis Obscura SE",
    price: 75000,
    category: "Fresh",
    notes: ["Perpaduan wangi juicy yang menyegarkan dari leci", "lychee", "bergamot", "dan grapefruit", "Sentuhan feminin dan lembut dari Indonesian rose", "mawar", "dan pir", "Kehangatan yang manis dan creamy dari vanila dan sentuhan aroma kayu"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Perpaduan wangi juicy yang menyegarkan dari leci, lychee, bergamot, dan grapefruit memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-61",
    name: "Octarine Sanctum Archanum SE",
    price: 75000,
    category: "Fresh",
    notes: ["Bergamot Italia", "Ginger", "Mint", "Mediterranean Fig", "Buah Ara", "White Cedarwood", "Melon Hijau", "Coconut"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot Italia, Ginger, Mint, Mediterranean Fig memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-62",
    name: "Rasasi Hawas Ice  Edp 100ml",
    price: 750000,
    category: "Fresh",
    notes: ["Italian lemon", "apel", "Sicilian bergamot", "dan star anise", "Plum", "orange blossom", "dan kapulaga", "Musk"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Italian lemon, apel, Sicilian bergamot, dan star anise memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-63",
    name: "Rayhaan Tiger Edp 100ml",
    price: 350000,
    category: "Floral",
    notes: ["Nutmeg", "Pala", "Clove", "Cengkeh", "dan Lemon", "Milk", "Rose", "Mawar"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Nutmeg, Pala, Clove, Cengkeh yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-64",
    name: "S&C Coco 35ml",
    price: 190000,
    category: "Fresh",
    notes: ["Bergamot", "Mandarin Orange", "dan Neroli", "Ylang-ylang", "Turkish Rose", "Peach Leaf", "dan Patchouli", "White Musk"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Bergamot, Mandarin Orange, dan Neroli, Ylang-ylang memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-65",
    name: "S&C CHNO 30ml",
    price: 185000,
    category: "Fresh",
    notes: ["Pink pepper", "orange blossom", "pear", "Coffee", "jasmin", "bitter almond", "licorice", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Pink pepper, orange blossom, pear, Coffee memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-66",
    name: "S&C Eulalie 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Leci", "Crème de Framboise", "Petalia", "Sampaguita", "Melati", "Roseraie de L'Hay", "Mawar", "Akigalawood"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Leci, Crème de Framboise, Petalia, Sampaguita yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-67",
    name: "S&C Irai Leima 35ml",
    price: 245000,
    category: "Floral",
    notes: ["Cassis bud", "daun blackcurrant", "Dalanghita", "jeruk keprok", "Pink peppercorn", "Duchesse De Nemours", "peony", "Water iris"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Cassis bud, daun blackcurrant, Dalanghita, jeruk keprok yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-68",
    name: "S&C Kie Raha 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Cajuput", "minyak kayu putih", "Yuzu", "dan Bigarade", "Aquamare", "mineral akuatik", "Orchid", "dan Crystal Amber"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Cajuput, minyak kayu putih, Yuzu, dan Bigarade yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-69",
    name: "S&C Kirithra 35ml",
    price: 245000,
    category: "Floral",
    notes: ["Sidr Honey", "Clementine", "dan Birch Tar", "Roseraie de l'Hay", "mawar", "Sampaguita", "melati", "dan Akigalawood"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Sidr Honey, Clementine, dan Birch Tar, Roseraie de l'Hay yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-70",
    name: "S&C Las Pozas 35ml",
    price: 200000,
    category: "Woody",
    notes: ["Datura", "Bunga Terompet Malaikat", "Angel's Trumpet", "Sumatran benzoin", "kemenyan Sumatra", "& Pala", "Nutmeg", "Cashmeran"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Datura, Bunga Terompet Malaikat, Angel's Trumpet, Sumatran benzoin memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-71",
    name: "S&C Loui 35ml",
    price: 190000,
    category: "Floral",
    notes: ["Verbena", "Violet leaf", "daun violet", "Aldehyde", "Rose", "mawar", "Peony", "Muguet"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Verbena, Violet leaf, daun violet, Aldehyde yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-72",
    name: "S&C Minouet 35ml",
    price: 220000,
    category: "Floral",
    notes: ["Starkrimson", "Galbanum", "Roseraie de l'Hay", "Bigarade Orange", "Iris Pallida", "Cashmere wood", "Fior di latte", "Ambergris"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Starkrimson, Galbanum, Roseraie de l'Hay, Bigarade Orange yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-73",
    name: "S&C Morfosia 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Rhubarb", "Yuzu", "Elletaria", "Cardamom", "Shogayu", "Ginger", "Narcissus", "Cape Jasmine"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Rhubarb, Yuzu, Elletaria, Cardamom yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-74",
    name: "S&C Ostara 35ml",
    price: 220000,
    category: "Sweet",
    notes: ["Raspberry", "Passionfruit", "markisa", "dan Pear", "Cassis Buds", "blackcurrant", "dan Lily of the Valley", "Amber"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Raspberry, Passionfruit, markisa, dan Pear menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-75",
    name: "S&C Postojna 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Blue Apple", "Lillikoi", "Violet Leaves", "Muguet", "Pink Pepper", "Maillette", "Rockrose", "Hollow Musk"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Blue Apple, Lillikoi, Violet Leaves, Muguet yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-76",
    name: "S&C Rae Nira 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Cajuput", "Bigarade", "Lavender", "Jasmine Sambac", "Calypsone", "Immortelle", "Tolu Balsam", "Golden Amber"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Cajuput, Bigarade, Lavender, Jasmine Sambac yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-77",
    name: "S&C S.O.T.B 35ml",
    price: 250000,
    category: "Floral",
    notes: ["Mandarin", "Galbanum", "dan Ylang-ylang", "Tuberose", "Jasmine", "dan Orange Flower", "Vanilla", "Tonka Bean"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Mandarin, Galbanum, dan Ylang-ylang, Tuberose yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-78",
    name: "S&C Saff 35ml",
    price: 250000,
    category: "Floral",
    notes: ["Bergamot", "Mandarin", "Saffron", "Ylang-ylang", "Lily of the Valley", "Muguet", "Jasmine", "Dry Amber"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Bergamot, Mandarin, Saffron, Ylang-ylang yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-79",
    name: "S&C SOFR 35ml",
    price: 240000,
    category: "Floral",
    notes: ["Tangerine Heart", "Bergamot", "Charentais", "Sampaguita", "Melati Putih", "Mimosa", "Tuberose", "Amber"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Tangerine Heart, Bergamot, Charentais, Sampaguita yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-80",
    name: "S&C Solaris 35ml",
    price: 220000,
    category: "Woody",
    notes: ["Bergamot", "Mandarin", "Violet Leaves", "Orris", "Freesia", "Cedarwood", "Vetiver", "Amber"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Bergamot, Mandarin, Violet Leaves, Orris memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-81",
    name: "S&C Xocolatl 35ml",
    price: 220000,
    category: "Floral",
    notes: ["Mandarin", "Pear", "Apple", "Heliotrope", "Plumeria", "Maltol", "Gardenia", ": Coconut"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Mandarin, Pear, Apple, Heliotrope yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-82",
    name: "SCENTCo Nightly 55ml",
    price: 230000,
    category: "Fresh",
    notes: ["Ginger", "Jahe", "Woodsy Notes", "Kayu-kayuan", "Bourbon Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["glamour night", "executive formal"],
    dupes: "",
    desc: "Kesegaran Ginger, Jahe, Woodsy Notes, Kayu-kayuan memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-83",
    name: "SCENTCo Overdose 35ml",
    price: 175000,
    category: "Woody",
    notes: ["Red Apple", "Cardamom", "Calabrian Bergamot", "Lavender", "Bourbon Geranium", "Clary Sage", "Tobacco Leaf", "Patchouli"],
    moods: ["mewah", "pesta mewah", "kopi hangat", "hutan"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Red Apple, Cardamom, Calabrian Bergamot, Lavender memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-84",
    name: "SCENTCo Warm Inter Intense 55ml",
    price: 230000,
    category: "Sweet",
    notes: ["Pink Pepper", "Juniper Berry", "dan Violet", "Vanilla", "Cinnamon", "Kayu Manis", "Sage", "dan Lavender"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Perpaduan manis Pink Pepper, Juniper Berry, dan Violet, Vanilla menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-85",
    name: "SCENTCo Warm Winter Le Parfum 55ml",
    price: 230000,
    category: "Fresh",
    notes: ["Pink Pepper", "Mandarin", "Lavender", "Sage", "Chestnut", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Kesegaran Pink Pepper, Mandarin, Lavender, Sage memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-86",
    name: "Zimaya BY Afnan Daiman ECLIPSE EDP 100ml",
    price: 410000,
    category: "Fresh",
    notes: ["Nutmeg", "pala", "Bergamot", "dan Mandarin", "Violet Leaf", "daun violet", "Amber", "dan Musk"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Nutmeg, pala, Bergamot, dan Mandarin memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-87",
    name: "Zimaya By Afnan Daiman Eden EDP 100ml",
    price: 410000,
    category: "Woody",
    notes: ["Rose", "Pink Pepper", "Almond", "Saffron", "Jasmine", "Musk", "Frankincense", "Sandalwood"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Rose, Pink Pepper, Almond, Saffron memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-88",
    name: "Velixir Morpheus 100ml",
    price: 550000,
    category: "Fresh",
    notes: ["Citron", "Bergamot", "dan Sicilian Orange", "Neroli dan Ginger", "Black Tea", "Ambroxan", "dan Guaiac Wood"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Citron, Bergamot, dan Sicilian Orange, Neroli dan Ginger memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-89",
    name: "Velixir Icarus 100ml",
    price: 550000,
    category: "Fresh",
    notes: ["Pir", "Bergamot Calabrian", "dan Mandarin Orange", "Jahe", "Bunga Jeruk", "dan Georgywood", "Musk", "Ambrofix"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Pir, Bergamot Calabrian, dan Mandarin Orange, Jahe memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-90",
    name: "Aqua Di Gio EDP",
    price: 1500000,
    category: "Fresh",
    notes: ["Sea Notes", "aroma laut yang menyegarkan", "dan Green Mandarin", "Clary Sage", "aroma herbal", "Lavender", "dan Geranium", "Mineral notes"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Sea Notes, aroma laut yang menyegarkan, dan Green Mandarin, Clary Sage memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-91",
    name: "Aqua Di Gio Parfum",
    price: 1700000,
    category: "Woody",
    notes: ["Bergamot dan marine notes", "Rosemary", "clary sage", "dan geranium", "Olibanum", "dupa", "dan nilam", "patchouli"],
    moods: ["pantai", "segar", "alam", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Bergamot dan marine notes, Rosemary, clary sage, dan geranium memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-92",
    name: "Coach EDP Women",
    price: 800000,
    category: "Sweet",
    notes: ["Raspberry leaf", "pear", "and pink pepper", "Turkish rose", "gardenia", "and cyclamen", "Suede musk", "sandalwood"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Raspberry leaf, pear, and pink pepper, Turkish rose menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-93",
    name: "D Cool Water Intense",
    price: 700000,
    category: "Fresh",
    notes: ["Green Mandarin", "memberikan kesegaran jeruk yang cerah", "Coconut Nectar atau air kelapa", "menambahkan nuansa manis dan eksotis", "Amber accord", "memberikan kehangatan dan kedalaman aroma yang tahan lama"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Kesegaran Green Mandarin, memberikan kesegaran jeruk yang cerah, Coconut Nectar atau air kelapa, menambahkan nuansa manis dan eksotis memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-94",
    name: "EROS Energy",
    price: 1350000,
    category: "Fresh",
    notes: ["Lemon", "Lime", "Grapefruit", "Blood Orange", "Sicilian Bergamot", "and Mandarin Orange", "Pink Peppercorn", "Blackcurrant"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Lemon, Lime, Grapefruit, Blood Orange memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-95",
    name: "EROS Flame",
    price: 1300000,
    category: "Woody",
    notes: ["Lemon", "Tangerine and Chinotto Accord", "Black Pepper", "Wild Mountain Rosemary", "Pepperwood", "Geranium and Rose", "Texas Cedar", "Patchouli"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Lemon, Tangerine and Chinotto Accord, Black Pepper, Wild Mountain Rosemary memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-96",
    name: "JPG Le Male Le Parfum",
    price: 1500000,
    category: "Floral",
    notes: ["Cardamom", "Lavender and Iris", "Vanilla", "Oriental notes", "and Woodsy notes"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Buketan bunga Cardamom, Lavender and Iris, Vanilla, Oriental notes yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-97",
    name: "Marcedes Benz CLUB Black EDP",
    price: 950000,
    category: "Floral",
    notes: ["Calabrian Bergamot", "jeruk segar", "dan Elemi", "resin dengan aksen kayu yang bersih", "Vanila yang manis lembut", "Melati", "Jasmine", "dan Musk"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Calabrian Bergamot, jeruk segar, dan Elemi, resin dengan aksen kayu yang bersih yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-98",
    name: "MY Way EDP",
    price: 1700000,
    category: "Floral",
    notes: ["Calabrian Bergamot dan Orange Blossom dari Mesir", "Indian Tuberose", "sedap malam", "dan Indian Jasmine", "Virginian Cedarwood", "Vanilla dari Madagaskar", "dan White Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Calabrian Bergamot dan Orange Blossom dari Mesir, Indian Tuberose, sedap malam, dan Indian Jasmine yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-99",
    name: "MYSLF COLLECTION EDP 100ml",
    price: 2050000,
    category: "Fresh",
    notes: ["Fresh Accord dengan Calabrian bergamot dan vert de bergamot", "Orange blossom heart dari Tunisia", "Woods Accord dengan Patchouli Heart dari Indonesia dan Ambrofix"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Fresh Accord dengan Calabrian bergamot dan vert de bergamot, Orange blossom heart dari Tunisia, Woods Accord dengan Patchouli Heart dari Indonesia dan Ambrofix memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-100",
    name: "MYSLF COLLECTION Le Parfum 100ml",
    price: 2200000,
    category: "Fresh",
    notes: ["Black pepper essence", "Orange blossom dari Tunisia", "Velvety woods dan vanilla bourbon infusion"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Kesegaran Black pepper essence, Orange blossom dari Tunisia, Velvety woods dan vanilla bourbon infusion memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-101",
    name: "PRADA Lhomme Intense",
    price: 1600000,
    category: "Woody",
    notes: ["Iris", "Amber", "Patchouli", "Tonka Bean", "Leather", "Sandalwood"],
    moods: ["mewah", "pesta mewah", "kopi hangat", "hutan"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Iris, Amber, Patchouli, Tonka Bean memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-102",
    name: "Prada Paradoxe EDP",
    price: 2000000,
    category: "Fresh",
    notes: ["Pear", "Tangerine", "dan Calabrian Bergamot", "Orange Blossom", "Neroli Essence", "dan Jasmine Sambac", "Madagascar Premium Bourbon Vanilla", "White Musk"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Pear, Tangerine, dan Calabrian Bergamot, Orange Blossom memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-103",
    name: "Stronger With You Intensely",
    price: 1700000,
    category: "Sweet",
    notes: ["Pink pepper", "juniper", "dan violet", "Toffee", "karamel", "cinnamon", "kayu manis", "lavender"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Perpaduan manis Pink pepper, juniper, dan violet, Toffee menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-104",
    name: "Valentino BIRI",
    price: 2000000,
    category: "Fresh",
    notes: ["Mineral notes", "daun violet", "dan garam", "Sage", "rempah aromatik", "dan jahe", "Vetiver berasap", "smoked vetiver"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Mineral notes, daun violet, dan garam, Sage memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-105",
    name: "YSL Libre EDP",
    price: 2000000,
    category: "Fresh",
    notes: ["Lavender Prancis", "Jeruk Mandarin", "Petitgrain", "dan Accord Blackcurrant", "Bunga Jeruk Maroko", "Orange Blossom", "dan Melati Sambac", "Vanilla Madagaskar"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Lavender Prancis, Jeruk Mandarin, Petitgrain, dan Accord Blackcurrant memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-106",
    name: "FA Liquid Brun Limited Edition EXDP 150ml",
    price: 750000,
    category: "Fresh",
    notes: ["Citrus", "Lavender", "dan Cardamom", "Kapulaga", "Orange Blossom", "Kayu Guaiac", "dan Rose", "Vanilla"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Citrus, Lavender, dan Cardamom, Kapulaga memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-107",
    name: "Maison JW Fajr OG Collection Grand 100ml",
    price: 450000,
    category: "Woody",
    notes: ["Lavender", "Cardamom", "Kapulaga", "dan Black Pepper", "Lada Hitam", "Incense", "Dupa", "dan Patchouli"],
    moods: ["hutan", "mewah", "kopi hangat", "alam"],
    ootds: ["executive formal", "glamour night", "formal"],
    dupes: "",
    desc: "Komposisi kayu-kayuan Lavender, Cardamom, Kapulaga, dan Black Pepper memancarkan ketegasan dan kehangatan maskulin. Aroma berkarakter untuk pribadi yang percaya diri.",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-108",
    name: "Maison JW Dubai Style Chocolate OG 100ml",
    price: 450000,
    category: "Sweet",
    notes: ["Karamel", "Pistachio", "dan sentuhan madu", "Cokelat", "Dark Chocolate", "dan Vanilla", "Kenari", "Hazelnut"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Karamel, Pistachio, dan sentuhan madu, Cokelat menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-109",
    name: "Mykonos Reflection Elixir 50ml",
    price: 280000,
    category: "Fresh",
    notes: ["Grapefruit", "Bergamot", "Ginger", "Jahe", "dan Rhubarb Leaves", "Ylang-Ylang", "Peach", "Persik"],
    moods: ["pantai", "segar", "santai", "alam"],
    ootds: ["casual", "sporty", "casual chic"],
    dupes: "",
    desc: "Kesegaran Grapefruit, Bergamot, Ginger, Jahe memberikan energi instan dan karakter yang bersih. Cocok untuk aktivitas harian dan cuaca tropis.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-110",
    name: "Mykonos Sansa 100ml",
    price: 269000,
    category: "Floral",
    notes: ["Moss", "Peach", "Black Tea", "Osmanthus", "Rose", "Tuberose", "Narcissus", "Toffee"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Moss, Peach, Black Tea, Osmanthus yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-111",
    name: "Mykonos Sparkling Rose 100ml",
    price: 300000,
    category: "Floral",
    notes: ["Damask Rose", "Orange", "Geranium", "May Rose", "Sparkling Red Berries", "Plum", "Sandalwood", "Patchouli"],
    moods: ["segar", "santai", "kopi hangat", "pantai"],
    ootds: ["casual", "casual chic", "executive formal"],
    dupes: "",
    desc: "Buketan bunga Damask Rose, Orange, Geranium, May Rose yang elegan dan menawan. Memberikan kesan feminin lembut namun tetap berkelas.",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-112",
    name: "Mykonos Silent Whisper 100ml",
    price: 380000,
    category: "Sweet",
    notes: ["Apple", "Apel", "Honeydew", "Blewah", "dan Melon", "Lily of The Valley dan Amber", "Vanilla dan Amber"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Apple, Apel, Honeydew, Blewah menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-113",
    name: "Mykonos Royal Ispahan 15ml",
    price: 85000,
    category: "Sweet",
    notes: ["Bergamot", "Leci", "Raspberry", "Bunga Kapas", "Violet", "Rose Milk", "Soft Wood", "Vanila"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Bergamot, Leci, Raspberry, Bunga Kapas menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-114",
    name: "Mykonos Crimson 15ml",
    price: 85000,
    category: "Sweet",
    notes: ["Cherry Nectar", "Poached Peach Creme", "Bergamot", "Caramel Creme Accord", "Geranium Petals", "Jasmine Absolute", "Patchouli Madagascar", "Honeyed Amber"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Perpaduan manis Cherry Nectar, Poached Peach Creme, Bergamot, Caramel Creme Accord menciptakan aroma gourmet yang hangat dan memikat. Sempurna untuk meninggalkan kesan mendalam.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "arz-115",
    name: "HMNS Tsana Elea 250ml",
    price: 190000,
    category: "Sweet",
    notes: ["Vanilla", "Musk", "Amber", "Sandalwood"],
    moods: ["manis", "kopi hangat", "pesta mewah", "santai"],
    ootds: ["casual", "glamour night", "casual chic"],
    dupes: "",
    desc: "Aroma manis dan lembut dengan sentuhan vanilla dan sandalwood yang elegan. Cocok untuk penggunaan sehari-hari dengan ketahanan yang luar biasa.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80"
  }
];

// Visual Quiz steps definitions
const QUIZ_QUESTIONS = {
  step1: {
    title: "Pilih suasana (Mood) yang paling memikat hati Anda:",
    subtitle: "Pilihan pertama Anda akan memandu alur pertanyaan selanjutnya secara otomatis.",
    options: [
      {
        id: "mood_beach",
        text: "Pantai Tropis",
        subtext: "Segar, hangat, angin laut, kebebasan",
        image: "assets/mood_beach.png",
        tags: ["segar", "pantai", "casual"],
        nextStep: "step2_casual"
      },
      {
        id: "mood_coffee",
        text: "Kopi Hangat",
        subtext: "Manis, tenang, cafe kayu, keintiman",
        image: "assets/mood_coffee.png",
        tags: ["manis", "kopi hangat", "santai"],
        nextStep: "step2_formal"
      },
      {
        id: "mood_forest",
        text: "Hutan Hujan",
        subtext: "Earthy, segar pinus, embun pagi, misteri",
        image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=500&q=80",
        tags: ["segar", "hutan", "alam"],
        nextStep: "step2_casual"
      },
      {
        id: "mood_party",
        text: "Pesta Mewah",
        subtext: "Glamour, karismatik, eksklusif, malam hari",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80",
        tags: ["manis", "mewah", "pesta mewah"],
        nextStep: "step2_formal"
      }
    ]
  },
  
  // Step 2 Casual Path
  step2_casual: {
    title: "Gaya Pakaian (OOTD) harian favorit Anda:",
    subtitle: "Arahkan gaya aroma Anda agar pas dengan pakaian Anda.",
    options: [
      {
        id: "ootd_casual",
        text: "Casual Chic",
        subtext: "Kaos santai, denim, sneakers nyaman",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80",
        tags: ["casual"],
        nextStep: "step3"
      },
      {
        id: "ootd_sporty",
        text: "Sporty Active",
        subtext: "Pakaian olahraga, hoodie, aktif bergerak",
        image: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=500&q=80",
        tags: ["sporty"],
        nextStep: "step3"
      }
    ]
  },

  // Step 2 Formal Path (Adaptive branch)
  step2_formal: {
    title: "Gaya Pakaian (OOTD) untuk momen penting Anda:",
    subtitle: "Aroma mewah untuk menunjang penampilan berkelas.",
    options: [
      {
        id: "ootd_formal",
        text: "Executive Formal",
        subtext: "Jas rapi, kemeja presisi, gaun elegan",
        image: "https://images.unsplash.com/photo-1487309078313-be80b3e07221?auto=format&fit=crop&w=500&q=80",
        tags: ["formal"],
        nextStep: "step3"
      },
      {
        id: "ootd_glamour",
        text: "Glamour Night Out",
        subtext: "Gaun mewah, blazer satin, riasan berani",
        image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=500&q=80",
        tags: ["mewah", "malam"],
        nextStep: "step3"
      }
    ]
  },

  // Final Step 3 (All paths converge here)
  step3: {
    title: "Kondisi penggunaan utama parfum Anda:",
    subtitle: "Menjamin kekuatan aroma (projection & sillage) bekerja maksimal.",
    options: [
      {
        id: "cond_outdoor",
        text: "Aktivitas Luar Ruangan (Panas)",
        subtext: "Butuh aroma segar yang tahan keringat",
        image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=500&q=80",
        tags: ["segar", "sporty"],
        nextStep: "results"
      },
      {
        id: "cond_indoor",
        text: "Indoor Ber-AC / Santai",
        subtext: "Butuh aroma manis-lembut yang menenangkan",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80",
        tags: ["manis", "santai", "floral"],
        nextStep: "results"
      }
    ]
  }
};

/**
 * Calculates Match Score between chosen user tags and database products
 * @param {Array} userTags - List of tags gathered from quiz answers
 * @param {Object} product - Product object from database
 * @returns {number} Score percentage (70 - 99)
 */
function calculateMatchScore(userTags, product) {
  let matches = 0;
  
  // Combine all product search targets
  const prodTags = [...(product.moods || []), ...(product.ootds || []), product.category.toLowerCase()];
  
  userTags.forEach(uTag => {
    if (prodTags.includes(uTag.toLowerCase())) {
      matches += 1;
    }
  });

  // Calculate base score
  let baseScore = 70; // Baseline match
  if (userTags.length > 0) {
    const ratio = matches / userTags.length;
    baseScore += Math.floor(ratio * 25);
  }
  
  // Add a slight pseudo-random variation based on perfume ID to keep it stable but realistic
  const idHash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variation = idHash % 5; // 0 to 4
  
  return Math.min(99, baseScore + variation);
}

/**
 * Generates dynamic explanation text based on user's choices.
 * @param {Array} selectedOptionTexts - Array of selected visual option labels
 * @param {Object} matchedProduct - The selected perfume
 * @returns {string} Dynamic description text
 */
function generateDynamicDescription(selectedOptionTexts, matchedProduct) {
  const mood = selectedOptionTexts[0] || "suasana pilihan Anda";
  const ootd = selectedOptionTexts[1] || "gaya pakaian Anda";
  const cond = selectedOptionTexts[2] || "aktivitas harian Anda";
  
  const topStr = (matchedProduct.topNotes||[]).join(", ");
  const midStr = (matchedProduct.middleNotes||[]).join(", ");
  const baseStr = (matchedProduct.baseNotes||[]).join(", ");
  const notesString = [topStr, midStr, baseStr].filter(Boolean).join(" | ");

  let desc = `Berdasarkan ketertarikan Anda pada **${mood}** yang dipadukan dengan gaya berpakaian **${ootd}** untuk kebutuhan **${cond}**, AI Arzoma merekomendasikan **${matchedProduct.name}** sebagai jodoh aroma Anda. `;
  
  if (matchedProduct.category === "Fresh") {
    desc += `Aroma dominan **${notesString}** memancarkan kesegaran alami yang clean dan energik, memastikan Anda tetap wangi segar sepanjang hari meski aktif bergerak.`;
  } else if (matchedProduct.category === "Woody") {
    desc += `Kombinasi eksotis **${notesString}** menciptakan aura ketegasan, misterius, dan kharisma intelektual yang mewah, memperkuat impresi profesional Anda.`;
  } else if (matchedProduct.category === "Sweet") {
    desc += `Sentuhan manis dari **${notesString}** membungkus penampilan Anda dengan kehangatan sensual yang ramah namun memikat perhatian siapa saja di sekitar Anda.`;
  } else {
    desc += `Sentuhan flora berkelas **${notesString}** menonjolkan kelembutan elegan dan kenyamanan batin yang menawan, sempurna untuk bersosialisasi.`;
  }
  
  return desc;
}
