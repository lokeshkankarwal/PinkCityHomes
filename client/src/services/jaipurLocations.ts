export interface JaipurLocation {
  name: string;
  city: "Jaipur";
  aliases: string[];
  latitude: number;
  longitude: number;
  isPopular?: boolean;
  category: "Locality" | "Colony" | "Road" | "Sub-Area" | "Industrial / SEZ";
}

export const JAIPUR_LOCATIONS: JaipurLocation[] = [
  // ── POPULAR CENTRAL & RESIDENTIAL LOCALITIES ──────────────────────
  {
    name: "Malviya Nagar",
    city: "Jaipur",
    aliases: ["Malviya Nagar", "Malviyanagar", "Malviya Nagar Jaipur", "World Trade Park", "WTP area"],
    latitude: 26.8547,
    longitude: 75.8123,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Mansarovar",
    city: "Jaipur",
    aliases: ["Mansarovar", "Mansarowar", "Mansarovar Jaipur", "Mansarovar Metro", "City Park"],
    latitude: 26.8643,
    longitude: 75.7667,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Vaishali Nagar",
    city: "Jaipur",
    aliases: ["Vaishali Nagar", "Vaishalinagar", "Vaishali", "Nursery Circle", "Amrapali Circle"],
    latitude: 26.9078,
    longitude: 75.7394,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "C-Scheme",
    city: "Jaipur",
    aliases: ["C-Scheme", "C Scheme", "CScheme", "Ahinsa Circle", "Statue Circle", "Panch Batti"],
    latitude: 26.9118,
    longitude: 75.8016,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Jagatpura",
    city: "Jaipur",
    aliases: ["Jagatpura", "Jagatpura Jaipur", "SKIT area", "Bombay Hospital", "CBI Colony"],
    latitude: 26.8228,
    longitude: 75.8362,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Raja Park",
    city: "Jaipur",
    aliases: ["Raja Park", "Rajapark", "Raja Park Jaipur", "LBS College"],
    latitude: 26.8974,
    longitude: 75.8302,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Civil Lines",
    city: "Jaipur",
    aliases: ["Civil Lines", "Civillines", "Civil Lines Jaipur", "Raj Bhavan"],
    latitude: 26.9038,
    longitude: 75.7878,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Bani Park",
    city: "Jaipur",
    aliases: ["Bani Park", "Banipark", "Collectorate", "Collectorate Circle"],
    latitude: 26.9295,
    longitude: 75.7925,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Tonk Road",
    city: "Jaipur",
    aliases: ["Tonk Road", "Tonk Road Jaipur", "Gopalpura Tonk Road", "Gaurav Tower", "Chomu House"],
    latitude: 26.8712,
    longitude: 75.7986,
    isPopular: true,
    category: "Road",
  },
  {
    name: "Ajmer Road",
    city: "Jaipur",
    aliases: ["Ajmer Road", "Ajmer Express Highway", "DCM Ajmer Road", "200 Feet Bypass Ajmer Road"],
    latitude: 26.8856,
    longitude: 75.7289,
    isPopular: true,
    category: "Road",
  },
  {
    name: "Vidyadhar Nagar",
    city: "Jaipur",
    aliases: ["Vidyadhar Nagar", "Vidhyadhar Nagar", "Vidhyadharnagar", "VDN", "Sector 1 Vidyadhar Nagar"],
    latitude: 26.9632,
    longitude: 75.7812,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Pratap Nagar",
    city: "Jaipur",
    aliases: ["Pratap Nagar", "Pratapnagar", "Haldi Ghati Marg", "Coaching Hub"],
    latitude: 26.7972,
    longitude: 75.8198,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Shyam Nagar",
    city: "Jaipur",
    aliases: ["Shyam Nagar", "Shyamnagar", "Vivek Vihar", "Janpath"],
    latitude: 26.8967,
    longitude: 75.7621,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Bapu Nagar",
    city: "Jaipur",
    aliases: ["Bapu Nagar", "Bapunagar", "Rajasthan University area", "Mangal Marg"],
    latitude: 26.8906,
    longitude: 75.8164,
    isPopular: true,
    category: "Locality",
  },
  {
    name: "Tilak Nagar",
    city: "Jaipur",
    aliases: ["Tilak Nagar", "Tilaknagar", "Birla Temple area"],
    latitude: 26.8932,
    longitude: 75.8276,
    isPopular: true,
    category: "Locality",
  },

  // ── RESIDENTIAL HUBS & COLONIES ──────────────────────────────────
  {
    name: "Gopalpura Bypass",
    city: "Jaipur",
    aliases: ["Gopalpura Bypass", "Gopalpura By Pass", "Gopalpura", "Triveni Flyover"],
    latitude: 26.8722,
    longitude: 75.7812,
    category: "Road",
  },
  {
    name: "Triveni Nagar",
    city: "Jaipur",
    aliases: ["Triveni Nagar", "Triveninagar", "Triveni Circle"],
    latitude: 26.8705,
    longitude: 75.7765,
    category: "Colony",
  },
  {
    name: "Nirman Nagar",
    city: "Jaipur",
    aliases: ["Nirman Nagar", "Nirmannagar", "Jan Path Nirman Nagar", "Kings Road"],
    latitude: 26.8945,
    longitude: 75.7486,
    category: "Colony",
  },
  {
    name: "Durgapura",
    city: "Jaipur",
    aliases: ["Durgapura", "Durgapura Railway Station", "Maharani Farm"],
    latitude: 26.8524,
    longitude: 75.7912,
    category: "Locality",
  },
  {
    name: "Sodala",
    city: "Jaipur",
    aliases: ["Sodala", "Sodala Elevated Road", "Ram Nagar Sodala", "Hawa Sadak"],
    latitude: 26.9012,
    longitude: 75.7734,
    category: "Locality",
  },
  {
    name: "Sirsi Road",
    city: "Jaipur",
    aliases: ["Sirsi Road", "Sirsi", "Kanakpura", "Bindayaka"],
    latitude: 26.9189,
    longitude: 75.7145,
    category: "Road",
  },
  {
    name: "Gandhi Path",
    city: "Jaipur",
    aliases: ["Gandhi Path", "Gandhi Path West", "Gandhi Path Vaishali"],
    latitude: 26.9015,
    longitude: 75.7312,
    category: "Road",
  },
  {
    name: "Queens Road",
    city: "Jaipur",
    aliases: ["Queens Road", "Queen's Road", "Queens Road Vaishali Nagar"],
    latitude: 26.9056,
    longitude: 75.7534,
    category: "Road",
  },
  {
    name: "Jawahar Nagar",
    city: "Jaipur",
    aliases: ["Jawahar Nagar", "Jawaharnagar", "Sector 1 Jawahar Nagar", "Sector 4 Jawahar Nagar"],
    latitude: 26.8954,
    longitude: 75.8398,
    category: "Locality",
  },
  {
    name: "Adarsh Nagar",
    city: "Jaipur",
    aliases: ["Adarsh Nagar", "Adarshnagar", "Dussehra Ground"],
    latitude: 26.9023,
    longitude: 75.8291,
    category: "Locality",
  },
  {
    name: "Lal Kothi",
    city: "Jaipur",
    aliases: ["Lal Kothi", "Lalkothi", "Vidhan Sabha area", "Jyoti Nagar"],
    latitude: 26.8912,
    longitude: 75.8012,
    category: "Locality",
  },
  {
    name: "Jyoti Nagar",
    city: "Jaipur",
    aliases: ["Jyoti Nagar", "Jyotinagar", "Vidhan Sabha"],
    latitude: 26.8945,
    longitude: 75.7956,
    category: "Locality",
  },
  {
    name: "Ashok Nagar",
    city: "Jaipur",
    aliases: ["Ashok Nagar", "Ashoknagar", "Ahinsa Circle"],
    latitude: 26.9087,
    longitude: 75.8045,
    category: "Locality",
  },
  {
    name: "Bajaj Nagar",
    city: "Jaipur",
    aliases: ["Bajaj Nagar", "Bajajnagar", "Gandhi Nagar Station"],
    latitude: 26.8745,
    longitude: 75.8089,
    category: "Locality",
  },
  {
    name: "Gandhi Nagar",
    city: "Jaipur",
    aliases: ["Gandhi Nagar", "Gandhinagar", "Gandhi Nagar Railway Station"],
    latitude: 26.8834,
    longitude: 75.8112,
    category: "Locality",
  },
  {
    name: "Barkat Nagar",
    city: "Jaipur",
    aliases: ["Barkat Nagar", "Barkatnagar", "Kisan Marg"],
    latitude: 26.8778,
    longitude: 75.7934,
    category: "Colony",
  },
  {
    name: "Mahesh Nagar",
    city: "Jaipur",
    aliases: ["Mahesh Nagar", "Maheshnagar", "80 Feet Road Mahesh Nagar"],
    latitude: 26.8789,
    longitude: 75.7789,
    category: "Colony",
  },
  {
    name: "Arjun Nagar",
    city: "Jaipur",
    aliases: ["Arjun Nagar", "Arjunnagar", "Gopalpura Arjun Nagar"],
    latitude: 26.8734,
    longitude: 75.7723,
    category: "Colony",
  },
  {
    name: "Patrakar Colony",
    city: "Jaipur",
    aliases: ["Patrakar Colony", "Patrakar", "Mansarovar Patrakar Colony"],
    latitude: 26.8456,
    longitude: 75.7489,
    category: "Colony",
  },
  {
    name: "Shipra Path",
    city: "Jaipur",
    aliases: ["Shipra Path", "Shipra Path Mansarovar", "VT Road"],
    latitude: 26.8589,
    longitude: 75.7689,
    category: "Road",
  },
  {
    name: "New Sanganer Road",
    city: "Jaipur",
    aliases: ["New Sanganer Road", "Metro Pillar Road", "Sanganer New Road"],
    latitude: 26.8745,
    longitude: 75.7645,
    category: "Road",
  },
  {
    name: "Mahal Road",
    city: "Jaipur",
    aliases: ["Mahal Road", "Mahal Road Jagatpura", "Akshay Patra Road"],
    latitude: 26.8145,
    longitude: 75.8456,
    category: "Road",
  },
  {
    name: "Akshay Patra",
    city: "Jaipur",
    aliases: ["Akshay Patra", "Akshaya Patra Temple", "Mahal Road Akshay Patra"],
    latitude: 26.8123,
    longitude: 75.8489,
    category: "Locality",
  },
  {
    name: "Siddharth Nagar",
    city: "Jaipur",
    aliases: ["Siddharth Nagar", "Siddharthnagar", "Airport Road Siddharth Nagar"],
    latitude: 26.8345,
    longitude: 75.8178,
    category: "Colony",
  },
  {
    name: "Airport Road",
    city: "Jaipur",
    aliases: ["Airport Road", "Terminal 2 Road", "JLN Marg Airport"],
    latitude: 26.8389,
    longitude: 75.8056,
    category: "Road",
  },
  {
    name: "Sanganer",
    city: "Jaipur",
    aliases: ["Sanganer", "Sanganer Stadium", "Sanganer Bazar", "Cheelgadi"],
    latitude: 26.8189,
    longitude: 75.7723,
    category: "Locality",
  },
  {
    name: "Muhana Mandi",
    city: "Jaipur",
    aliases: ["Muhana Mandi", "Muhana", "Muhana Road", "Mansarovar Extension Muhana"],
    latitude: 26.8123,
    longitude: 75.7412,
    category: "Locality",
  },
  {
    name: "ISKCON Road",
    city: "Jaipur",
    aliases: ["ISKCON Road", "ISKCON Temple Mansarovar", "Dholai ISKCON Road"],
    latitude: 26.8389,
    longitude: 75.7534,
    category: "Road",
  },
  {
    name: "Prithviraj Nagar",
    city: "Jaipur",
    aliases: ["Prithviraj Nagar", "PRN", "Prithviraj Nagar South", "Prithviraj Nagar North"],
    latitude: 26.8534,
    longitude: 75.7312,
    category: "Locality",
  },
  {
    name: "Devi Nagar",
    city: "Jaipur",
    aliases: ["Devi Nagar", "Devinagar", "New Sanganer Road Devi Nagar"],
    latitude: 26.8834,
    longitude: 75.7678,
    category: "Colony",
  },
  {
    name: "Shanti Nagar",
    city: "Jaipur",
    aliases: ["Shanti Nagar", "Shantinagar", "Durgapura Shanti Nagar"],
    latitude: 26.8612,
    longitude: 75.7834,
    category: "Colony",
  },
  {
    name: "DCM",
    city: "Jaipur",
    aliases: ["DCM", "DCM Ajmer Road", "DCM Flyover"],
    latitude: 26.8889,
    longitude: 75.7345,
    category: "Sub-Area",
  },
  {
    name: "Heera Nagar",
    city: "Jaipur",
    aliases: ["Heera Nagar", "Heeranagar", "Heera Nagar Ajmer Road"],
    latitude: 26.8845,
    longitude: 75.7389,
    category: "Colony",
  },
  {
    name: "Rani Sati Nagar",
    city: "Jaipur",
    aliases: ["Rani Sati Nagar", "Ranisati Nagar", "Nirman Nagar Rani Sati"],
    latitude: 26.8878,
    longitude: 75.7512,
    category: "Colony",
  },
  {
    name: "Swej Farm",
    city: "Jaipur",
    aliases: ["Swej Farm", "Swejfarm", "New Sanganer Road Swej Farm"],
    latitude: 26.8812,
    longitude: 75.7712,
    category: "Colony",
  },
  {
    name: "Hasanpura",
    city: "Jaipur",
    aliases: ["Hasanpura", "Hasanpura Railway Colony"],
    latitude: 26.9189,
    longitude: 75.7834,
    category: "Locality",
  },
  {
    name: "Shastri Nagar",
    city: "Jaipur",
    aliases: ["Shastri Nagar", "Shastrinagar", "Science Park"],
    latitude: 26.9456,
    longitude: 75.7956,
    category: "Locality",
  },
  {
    name: "Subhash Nagar",
    city: "Jaipur",
    aliases: ["Subhash Nagar", "Subhashnagar", "Shopping Centre Subhash Nagar"],
    latitude: 26.9389,
    longitude: 75.7912,
    category: "Colony",
  },
  {
    name: "Murlipura",
    city: "Jaipur",
    aliases: ["Murlipura", "Murlipura Scheme", "Dadi Ka Phatak"],
    latitude: 26.9745,
    longitude: 75.7689,
    category: "Locality",
  },
  {
    name: "Jhotwara",
    city: "Jaipur",
    aliases: ["Jhotwara", "Jhotwara Flyover", "Panchyawala Jhotwara", "Lata Circle"],
    latitude: 26.9489,
    longitude: 75.7489,
    category: "Locality",
  },
  {
    name: "Khatipura",
    city: "Jaipur",
    aliases: ["Khatipura", "Khatipura Railway Station", "Khatipura Circle"],
    latitude: 26.9245,
    longitude: 75.7412,
    category: "Locality",
  },
  {
    name: "Kalwar Road",
    city: "Jaipur",
    aliases: ["Kalwar Road", "Kalwar", "Govindpura Kalwar Road", "Hathoj"],
    latitude: 26.9534,
    longitude: 75.7189,
    category: "Road",
  },
  {
    name: "Niwaru Road",
    city: "Jaipur",
    aliases: ["Niwaru Road", "Niwaru", "Jhotwara Niwaru Road"],
    latitude: 26.9678,
    longitude: 75.7312,
    category: "Road",
  },
  {
    name: "Benar Road",
    city: "Jaipur",
    aliases: ["Benar Road", "Benad Road", "Dadi Ka Phatak Benar Road"],
    latitude: 26.9812,
    longitude: 75.7456,
    category: "Road",
  },
  {
    name: "Sikar Road",
    city: "Jaipur",
    aliases: ["Sikar Road", "Sikar Highway", "VKIA Sikar Road", "Harmada"],
    latitude: 26.9856,
    longitude: 75.7789,
    category: "Road",
  },
  {
    name: "Harmada",
    city: "Jaipur",
    aliases: ["Harmada", "Harmada Ghati", "Sikar Road Harmada"],
    latitude: 27.0123,
    longitude: 75.7689,
    category: "Locality",
  },
  {
    name: "Sitapura",
    city: "Jaipur",
    aliases: ["Sitapura", "Sitapura Industrial Area", "RIICO Sitapura", "Mahatma Gandhi Hospital"],
    latitude: 26.7789,
    longitude: 75.8312,
    category: "Industrial / SEZ",
  },
  {
    name: "Mahindra SEZ",
    city: "Jaipur",
    aliases: ["Mahindra SEZ", "Mahindra World City", "Ajmer Road SEZ"],
    latitude: 26.8345,
    longitude: 75.6123,
    category: "Industrial / SEZ",
  },
  {
    name: "Mahapura",
    city: "Jaipur",
    aliases: ["Mahapura", "Mahapura Ajmer Road", "Mahapura Mod"],
    latitude: 26.8612,
    longitude: 75.6789,
    category: "Locality",
  },
  {
    name: "Vatika",
    city: "Jaipur",
    aliases: ["Vatika", "Vatika Tonk Road", "Vatika Infotech City"],
    latitude: 26.7345,
    longitude: 75.7891,
    category: "Township" as any,
  },
  {
    name: "Shivdaspura",
    city: "Jaipur",
    aliases: ["Shivdaspura", "Shivdaspura Tonk Road", "Chaksu Mod"],
    latitude: 26.6891,
    longitude: 75.8234,
    category: "Locality",
  },
  {
    name: "Amer Road",
    city: "Jaipur",
    aliases: ["Amer Road", "Amber Road", "Jal Mahal area", "Zorawar Singh Gate"],
    latitude: 26.9534,
    longitude: 75.8456,
    category: "Road",
  },
  {
    name: "Amer",
    city: "Jaipur",
    aliases: ["Amer", "Amber", "Amer Fort area"],
    latitude: 26.9856,
    longitude: 75.8512,
    category: "Locality",
  },
  {
    name: "Kukas",
    city: "Jaipur",
    aliases: ["Kukas", "Kookas", "Delhi Highway Kukas"],
    latitude: 27.0456,
    longitude: 75.8912,
    category: "Locality",
  },
  {
    name: "Delhi Road",
    city: "Jaipur",
    aliases: ["Delhi Road", "Delhi Highway", "NH 48 Delhi Road"],
    latitude: 27.0123,
    longitude: 75.8712,
    category: "Road",
  },
  {
    name: "Agra Road",
    city: "Jaipur",
    aliases: ["Agra Road", "Agra Highway", "Ghat Ki Guni", "Transport Nagar"],
    latitude: 26.8912,
    longitude: 75.8678,
    category: "Road",
  },
  {
    name: "Kanota",
    city: "Jaipur",
    aliases: ["Kanota", "Kanota Agra Road"],
    latitude: 26.8789,
    longitude: 75.9512,
    category: "Locality",
  },
  {
    name: "Goner Road",
    city: "Jaipur",
    aliases: ["Goner Road", "Goner", "Jagadguru Ramanandacharya Rajasthan Sanskrit University"],
    latitude: 26.8123,
    longitude: 75.9012,
    category: "Road",
  },
  {
    name: "Johari Bazar",
    city: "Jaipur",
    aliases: ["Johari Bazar", "Johari Bazaar", "Walled City", "Badi Chaupar"],
    latitude: 26.9212,
    longitude: 75.8267,
    category: "Locality",
  },
  {
    name: "Chandpole",
    city: "Jaipur",
    aliases: ["Chandpole", "Chandpole Bazar", "Chandpole Metro Station"],
    latitude: 26.9245,
    longitude: 75.8089,
    category: "Locality",
  },
  {
    name: "Tripolia Bazar",
    city: "Jaipur",
    aliases: ["Tripolia Bazar", "Tripolia Bazaar", "City Palace area", "Chhoti Chaupar"],
    latitude: 26.9234,
    longitude: 75.8201,
    category: "Locality",
  },
  {
    name: "Ramganj",
    city: "Jaipur",
    aliases: ["Ramganj", "Ramganj Bazar", "Ramganj Chaupar"],
    latitude: 26.9245,
    longitude: 75.8389,
    category: "Locality",
  },
  {
    name: "Brijlalpura",
    city: "Jaipur",
    aliases: ["Brijlalpura", "Brijlalpura Mansarovar"],
    latitude: 26.8856,
    longitude: 75.7534,
    category: "Colony",
  },
  {
    name: "Mansarovar Extension",
    city: "Jaipur",
    aliases: ["Mansarovar Extension", "Mansarowar Extension", "Mansarovar Extension South"],
    latitude: 26.8345,
    longitude: 75.7612,
    category: "Sub-Area",
  },
  {
    name: "Vaishali Nagar Extension",
    city: "Jaipur",
    aliases: ["Vaishali Nagar Extension", "Vaishali Extension", "Rangoli Gardens area"],
    latitude: 26.9189,
    longitude: 75.7289,
    category: "Sub-Area",
  },
  {
    name: "Jhotwara Extension",
    city: "Jaipur",
    aliases: ["Jhotwara Extension", "Tara Nagar Jhotwara"],
    latitude: 26.9589,
    longitude: 75.7389,
    category: "Sub-Area",
  },
  {
    name: "Sirsi Road Extension",
    city: "Jaipur",
    aliases: ["Sirsi Road Extension", "Sirsi Extension"],
    latitude: 26.9256,
    longitude: 75.6989,
    category: "Sub-Area",
  },
  {
    name: "Ajmer Road Extension",
    city: "Jaipur",
    aliases: ["Ajmer Road Extension", "Bagru Road", "Omaxe City Ajmer Road"],
    latitude: 26.8512,
    longitude: 75.6412,
    category: "Sub-Area",
  },
  {
    name: "Kalwar Road Extension",
    city: "Jaipur",
    aliases: ["Kalwar Road Extension", "Hathoj Extension"],
    latitude: 26.9689,
    longitude: 75.6891,
    category: "Sub-Area",
  },
  {
    name: "Sikar Road Extension",
    city: "Jaipur",
    aliases: ["Sikar Road Extension", "Harmada Extension", "Todi"],
    latitude: 27.0289,
    longitude: 75.7534,
    category: "Sub-Area",
  },
];

/**
 * Normalizes input string for search comparison:
 * Lowercases, strips punctuation (hyphens, apostrophes, commas), and collapses whitespace.
 */
export function normalizeLocationText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_',.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Autocomplete search across Jaipur's comprehensive location catalog.
 * Ranks by exact match, prefix match, alias match, and substring match.
 */
export function searchJaipurLocations(query: string, maxResults = 8): JaipurLocation[] {
  const q = normalizeLocationText(query);
  if (!q) {
    return JAIPUR_LOCATIONS.filter((l) => l.isPopular);
  }

  const scored = JAIPUR_LOCATIONS.map((loc) => {
    const normName = normalizeLocationText(loc.name);
    const normAliases = loc.aliases.map(normalizeLocationText);

    let score = 0;
    if (normName === q) score += 100;
    else if (normName.startsWith(q)) score += 50;
    else if (normAliases.some((a) => a === q)) score += 45;
    else if (normAliases.some((a) => a.startsWith(q))) score += 30;
    else if (normName.includes(q)) score += 20;
    else if (normAliases.some((a) => a.includes(q))) score += 10;

    return { loc, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((s) => s.loc);
}

/**
 * Returns popular localities for quick filter chips.
 */
export function getPopularJaipurLocalities(): JaipurLocation[] {
  return JAIPUR_LOCATIONS.filter((l) => l.isPopular);
}

/**
 * Resolves a query or locality name to its canonical JaipurLocation object if available.
 */
export function findJaipurLocation(nameOrAlias: string): JaipurLocation | undefined {
  const norm = normalizeLocationText(nameOrAlias);
  return JAIPUR_LOCATIONS.find((l) => {
    if (normalizeLocationText(l.name) === norm) return true;
    return l.aliases.some((a) => normalizeLocationText(a) === norm);
  });
}
