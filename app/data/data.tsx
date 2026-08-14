export interface Product {
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  image: string;
  tag?: string;
  description?: string;
  brand?: string;
  condition?: "New" | "Refurbished" | "Like New";
  colors?: string[];
  productDetails?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isSponsored?: boolean;
  stock?: number;
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string;
  banner: string;
  rating: number;
  verified: boolean;
  category: string;
  description: string;
  bannerMessage?: string;
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString("en-US");
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  bannerImage: string;
  filterValue: string;
}

export const CATEGORIES_DATA: Category[] = [
  {
    id: "phones-tablets",
    slug: "phones-tablets",
    name: "Phone & Tablets",
    description:
      "Explore cutting-edge smartphones, flagship tablets, and mobile technology.",
    bannerImage: "/images/categories/gadgets.jpg",
    filterValue: "Electronics",
  },
  {
    id: "gadgets-accessories",
    slug: "gadgets-accessories",
    name: "Gadgets & Accessories",
    description:
      "Premium headphones, smartwatches, cameras, displays, and desktop gear.",
    bannerImage: "/images/categories/gadgets3.jpg",
    filterValue: "Audio",
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Apparel & Fashion",
    description:
      "Trendy sportswear, luxury streetwear, footwear, caps, and everyday apparel.",
    bannerImage: "/images/categories/shirt.jpg",
    filterValue: "All",
  },
  {
    id: "furniture",
    slug: "furniture",
    name: "Furniture & Living",
    description:
      "Scandinavian dining tables, luxury upholstered beds, accent chairs, and living decor.",
    bannerImage: "/images/categories/furniture.jpg",
    filterValue: "Accessories",
  },
  {
    id: "beauty-care",
    slug: "beauty-care",
    name: "Beauty & Care",
    description:
      "Nourishing body lotions, skincare serums, lip treatments, and personal care.",
    bannerImage: "/images/categories/beauty-care.jpg",
    filterValue: "All",
  },
  {
    id: "groceries",
    slug: "groceries",
    name: "Groceries",
    description:
      "Fresh farm produce, pantry cereals, beverages, and daily household staples.",
    bannerImage: "/images/categories/groceries.jpg",
    filterValue: "Wearables",
  },
  {
    id: "appliances",
    slug: "appliances",
    name: "Home Appliances",
    description:
      "Smart TVs, inverter split AC units, washers, countertop microwave ovens, and fridges.",
    bannerImage: "/images/categories/home.jpg",
    filterValue: "Appliances",
  },
];

export const PRODUCTS_DATA: Product[] = [
  // 1. Phones & Tablets
  {
    id: "pixel-10-pro",
    title: "Google Pixel 10 Pro 5G",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1498500,
    originalPrice: 1648500,
    image: "/images/products/google-pixel-10-pro.jpg",
    tag: "Flagship",
    brand: "Google",
    condition: "New",
    colors: ["Black", "Titanium", "Hazel"],
    isFeatured: true,
    isNewArrival: false,
    isSponsored: true,
    stock: 8,
    description:
      "Tensor powered smartphone with pro camera system and Gemini AI integration.",
    productDetails: [
      "Next-generation Google Tensor G4 processor with integrated Titan M2 security coprocessor.",
      "6.7-inch Super Actua LTPO OLED display with 1-120Hz adaptive refresh rate and 3000 nits peak brightness.",
      "Triple pro rear camera system: 50MP main sensor, 48MP ultrawide with Macro Focus, and 48MP 5x telephoto lens.",
      "All-day battery life (5000 mAh) with 45W fast wired charging and fast Qi-certified wireless charging.",
      "Deep Gemini Nano AI features including Magic Cue, Live Translate, and Add Me photo synthesis.",
      "IP68 dust and water resistance with Corning Gorilla Glass Victus 2 front and back cover glass.",
    ],
  },
  {
    id: "pixel-6",
    title: "Google Pixel 6 128GB",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 748500,
    originalPrice: 898500,
    image: "/images/products/google-pixel-6.jpg",
    brand: "Google",
    condition: "Refurbished",
    colors: ["Black", "Green"],
    description: "Sleek dual-camera Android phone with custom Tensor chip.",
    productDetails: [
      "First-generation custom Google Tensor SoC designed for AI and computational photography.",
      "6.4-inch Smooth Display (90Hz refresh rate) with FHD+ OLED resolution.",
      "50MP wide camera capturing 150% more light than previous generations.",
      "Factory refurbished and multi-point tested for guaranteed functional excellence.",
      "Real Tone skin tone technology for authentic representation in photography.",
    ],
  },
  {
    id: "pixel-7",
    title: "Google Pixel 7 5G",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 898500,
    originalPrice: 1048500,
    image: "/images/products/google-pixel-7.jpg",
    tag: "Popular",
    brand: "Google",
    condition: "New",
    colors: ["White", "Hazel"],
    description:
      "Refined design with advanced photo unblur and fast performance.",
    productDetails: [
      "Google Tensor G2 processor for faster speech recognition and cinematic blur video.",
      "6.3-inch FHD+ OLED display with up to 90Hz refresh rate and 25% brighter outdoor viewing.",
      "Photo Unblur feature in Google Photos to restore blurry vintage or recent images.",
      "Built-in VPN powered by Google One for encrypted public network browsing.",
    ],
  },
  {
    id: "ipad-pro-keyboard",
    title: "iPad Pro M2 with Magic Keyboard",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1648500,
    originalPrice: 1798500,
    image: "/images/products/ipad-pro-with-keyboard.jpg",
    tag: "Trending",
    brand: "Apple",
    condition: "New",
    colors: ["Space Gray", "Silver"],
    isFeatured: false,
    isNewArrival: false,
    description:
      "Liquid Retina XDR display tablet with M2 chip and floating Magic Keyboard.",
    productDetails: [
      "Apple M2 chip with 8-core CPU, 10-core GPU, and 16-core Neural Engine.",
      "12.9-inch Liquid Retina XDR display featuring Mini-LED backlight with 1,000,000:1 contrast ratio.",
      "Includes detachable Magic Keyboard with floating cantilever design, backlit keys, and built-in trackpad.",
      "Supports Apple Pencil hover detection up to 12mm above the display.",
      "Thunderbolt / USB 4 port with support for external displays up to 6K resolution.",
    ],
  },
  {
    id: "ipad-pro-standalone",
    title: "iPad Pro 12.9-inch Liquid Retina",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1498500,
    image: "/images/products/ipad-pro.jpg",
    brand: "Apple",
    condition: "Like New",
    colors: ["Space Gray"],
    description:
      "Pro performance tablet for digital art, photo editing, and multitasking.",
    productDetails: [
      "Ultra-responsive 12.9-inch Liquid Retina XDR display with ProMotion 120Hz technology.",
      "12MP Ultra Wide front camera with Center Stage automatic framing.",
      "Quad speaker audio array and studio-quality five-microphone setup.",
      "Like New condition certified through rigorous quality diagnostics.",
    ],
  },
  {
    id: "iphone-12-pro-max",
    title: "iPhone 12 Pro Max Gold 256GB",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1198500,
    originalPrice: 1348500,
    image: "/images/products/iphone-12-pro-max.jpg",
    brand: "Apple",
    condition: "Refurbished",
    colors: ["Gold", "Silver"],
    description:
      "Super Retina XDR OLED display with Ceramic Shield and LiDAR scanner.",
    productDetails: [
      "6.7-inch Super Retina XDR OLED display with Ceramic Shield front glass.",
      "A14 Bionic chip with 16-core Neural Engine for high-speed computing.",
      "Pro 12MP camera system (Ultra Wide, Wide, Telephoto) with 5x optical zoom range.",
      "LiDAR Scanner for enhanced Night mode portraits and AR experiences.",
    ],
  },
  {
    id: "iphone-12",
    title: "iPhone 12 128GB",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 823500,
    originalPrice: 943500,
    image: "/images/products/iphone-12.jpg",
    brand: "Apple",
    condition: "Like New",
    colors: ["Blue", "Black", "White"],
    description:
      "5G speed, A14 Bionic chip, and dual 12MP Ultra Wide camera system.",
    productDetails: [
      "6.1-inch Super Retina XDR OLED display with HDR10 and Dolby Vision.",
      "Advanced dual-camera system with 12MP Ultra Wide and Wide lenses.",
      "MagSafe wireless charging compatibility up to 15W.",
    ],
  },
  {
    id: "iphone-13-pro-max",
    title: "iPhone 13 Pro Max Sierra Blue",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1348500,
    originalPrice: 1498500,
    image: "/images/products/iphone-13-pro-max.jpg",
    tag: "Best Seller",
    brand: "Apple",
    condition: "New",
    colors: ["Sierra Blue", "Graphite"],
    description: "ProMotion 120Hz display with Cinematic mode video recording.",
    productDetails: [
      "Super Retina XDR display with ProMotion (adaptive refresh up to 120Hz).",
      "Cinematic mode in 1080p at 30 fps with automatic shallow depth-of-field focus transitions.",
      "A15 Bionic chip with 5-core GPU for ultra-fast graphics performance.",
      "Up to 28 hours of video playback battery endurance.",
    ],
  },
  {
    id: "iphone-13",
    title: "iPhone 13 128GB Midnight",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 973500,
    originalPrice: 1093500,
    image: "/images/products/iphone-13.jpg",
    brand: "Apple",
    condition: "New",
    colors: ["Midnight", "Pink"],
    description:
      "Advanced dual-camera system with Sensor-shift OIS and long battery life.",
    productDetails: [
      "Diagonal dual 12MP camera layout with sensor-shift optical image stabilization.",
      "Smart HDR 4 optimizes contrast, lighting, and skin tones for up to four people in a shot.",
      "IP68 rating under IEC standard 60529.",
    ],
  },
  {
    id: "iphone-16",
    title: "iPhone 16 Pro Titanium",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1798500,
    originalPrice: 1948500,
    image: "/images/products/iphone-16.jpg",
    tag: "New",
    brand: "Apple",
    condition: "New",
    colors: ["Titanium", "Black", "White"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Grade 5 titanium design with A18 Pro chip and dedicated Camera Control button.",
    productDetails: [
      "Grade 5 titanium design with new refined micro-blasted finish.",
      "A18 Pro chip with 6-core GPU delivering breakthrough thermal efficiency and performance.",
      "48MP Fusion camera with 2nd-gen quad-pixel sensor and 4K 120 fps Dolby Vision video.",
      "Dedicated capacitive Camera Control button with haptic feedback for instant camera launch and zoom adjustment.",
    ],
  },
  {
    id: "redmi-pad-2-pro",
    title: "Redmi Pad 2 Pro 11-inch",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 373500,
    originalPrice: 433500,
    image: "/images/products/redmi-pad-2-pro.jpg",
    brand: "Xiaomi",
    condition: "New",
    colors: ["Gray", "Green"],
    description:
      "High refresh rate display tablet with quad speakers and long-lasting battery.",
    productDetails: [
      "11-inch 2.5K high resolution display with 120Hz AdaptiveSync refresh rate.",
      "Quad speakers supporting Dolby Atmos for immersive audio experience.",
      "8000 mAh large capacity battery with 33W fast charging support.",
    ],
  },
  {
    id: "samsung-s20",
    title: "Samsung Galaxy S20 5G",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 643500,
    originalPrice: 748500,
    image: "/images/products/samsung-galaxy-s20.jpg",
    brand: "Samsung",
    condition: "Refurbished",
    colors: ["Cosmic Gray", "Cloud Blue"],
    description: "Dynamic AMOLED 2X 120Hz display with 30x Space Zoom camera.",
    productDetails: [
      "6.2-inch Quad HD+ Dynamic AMOLED 2X Infinity-O Display.",
      "Single Take AI mode captures multiple photos and video formats in one tap.",
      "4000 mAh battery with Super Fast Charging and Wireless PowerShare.",
    ],
  },
  {
    id: "samsung-s21-ultra",
    title: "Samsung Galaxy S21 Ultra 5G",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1048500,
    originalPrice: 1198500,
    image: "/images/products/samsung-galaxy-s21-ultra.jpg",
    tag: "Pro",
    brand: "Samsung",
    condition: "Like New",
    colors: ["Phantom Black", "Phantom Silver"],
    description: "108MP camera with S Pen support and 100x Space Zoom.",
    productDetails: [
      "6.8-inch Quad HD+ Dynamic AMOLED 2X display with 120Hz adaptive refresh rate.",
      "Dual telephoto lens system (3x and 10x optical zoom) with 100x Space Zoom.",
      "First Galaxy S Series smartphone compatible with S Pen technology.",
    ],
  },
  {
    id: "samsung-s24",
    title: "Samsung Galaxy S24 Ultra 512GB",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1723500,
    originalPrice: 1948500,
    image: "/images/products/samsung-galaxy-s24.jpg",
    tag: "AI Powered",
    brand: "Samsung",
    condition: "New",
    colors: ["Titanium Black", "Titanium Gray", "Yellow"],
    description:
      "Titanium armor frame with Circle to Search, Live Translate, and built-in S Pen.",
    productDetails: [
      "Galaxy AI features: Live Translate phone calls, Circle to Search with Google, and Note Assist.",
      "Titanium frame construction with Corning Gorilla Armor anti-reflective glass.",
      "200MP quad-telephoto camera with 5x optical zoom and ProVisual Engine.",
    ],
  },
  {
    id: "samsung-s25-ultra",
    title: "Samsung Galaxy S25 Ultra",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1873500,
    originalPrice: 2098500,
    image: "/images/products/samsung-galaxy-s25-ultra.jpg",
    tag: "Next Gen",
    brand: "Samsung",
    condition: "New",
    colors: ["Titanium Blue", "Titanium Silver"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Ultra-slim ergonomic titanium chassis with 200MP camera and Snapdragon 8 Elite.",
    productDetails: [
      "Powered by Snapdragon 8 Elite for Galaxy with customized NPU for on-device AI model processing.",
      "Redesigned rounded-edge titanium body for superior ergonomic palm comfort.",
      "Upgraded 50MP ultrawide sensor alongside 200MP main camera with 8K 60fps video capture.",
    ],
  },
  {
    id: "samsung-s26-ultra",
    title: "Samsung Galaxy S26 Ultra Edition",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 2023500,
    image: "/images/products/samsung-galaxy-s26-ultra.jpg",
    tag: "Concept",
    brand: "Samsung",
    condition: "New",
    colors: ["Phantom Black"],
    description:
      "Futuristic smartphone with quad lens periscope zoom and zero-bezel display.",
    productDetails: [
      "Zero-bezel edge-to-edge futuristic AMOLED panel.",
      "Quad lens periscope optical zoom with AI frame interpolation.",
      "Graphene cooling chamber for peak continuous gaming workloads.",
    ],
  },
  {
    id: "samsung-s9-tab",
    title: "Samsung Galaxy Tab S9 Ultra",
    categorySlug: "phones-tablets",
    categoryName: "Phone & Tablets",
    price: 1498500,
    originalPrice: 1723500,
    image: "/images/products/samsung-s9-tablet.jpg",
    brand: "Samsung",
    condition: "New",
    colors: ["Graphite", "Beige"],
    description:
      "Massive 14.6-inch Dynamic AMOLED screen tablet with IP68 water resistance.",
    productDetails: [
      "Massive 14.6-inch Dynamic AMOLED 2X display with Vision Booster.",
      "IP68 dust and water resistant rating for both tablet body and bundled S Pen.",
      "Quad speakers tuned by AKG with Dolby Atmos audio technology.",
    ],
  },

  // 2. Gadgets & Accessories
  {
    id: "airpods-pro-2",
    title: "AirPods Pro (2nd Generation)",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 373500,
    originalPrice: 418500,
    image: "/images/products/airpod-pro.jpg",
    tag: "Best Seller",
    brand: "Apple",
    condition: "New",
    colors: ["White"],
    isSponsored: true,
    description:
      "Active Noise Cancellation, Transparency mode, and Personalized Spatial Audio.",
    productDetails: [
      "H2 chip powered Active Noise Cancellation cancels up to 2x more background noise.",
      "MagSafe Charging Case (USB-C) with Precision Finding speaker and lanyard loop.",
      "Adaptive Audio dynamically blends Transparency mode and Active Noise Cancellation.",
      "Up to 6 hours of listening time with ANC enabled on a single charge.",
    ],
  },
  {
    id: "apple-earpods-lightning",
    title: "Apple EarPods with Lightning Connector",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 43500,
    image: "/images/products/apple-earpods.jpg",
    brand: "Apple",
    condition: "New",
    colors: ["White"],
    description:
      "Classic in-ear headphones with built-in remote for volume and playback control.",
    productDetails: [
      "Designed by Apple to geometry-fit the contour of human ears.",
      "Built-in in-line remote to adjust volume, control music playback, and answer calls.",
      "Direct Lightning digital audio output without needing an adapter.",
    ],
  },
  {
    id: "apple-wired-earpods",
    title: "Apple Wired EarPods 3.5mm Headphone Plug",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 28500,
    image: "/images/products/apple-wired-earpods.jpg",
    brand: "Apple",
    condition: "New",
    colors: ["White"],
    description: "Ergonomic wired earphones designed to maximize sound output.",
    productDetails: [
      "Universal 3.5mm headphone jack compatible with laptops, audio interfaces, and legacy devices.",
      "Durable strain-relief cable construction.",
    ],
  },
  {
    id: "apple-magic-mouse",
    title: "Apple Magic Mouse (Wireless)",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 118500,
    originalPrice: 133500,
    image: "/images/products/apple-mouse.jpg",
    brand: "Apple",
    condition: "New",
    colors: ["White", "Black"],
    description:
      "Rechargeable wireless mouse with Multi-Touch surface for smooth swiping.",
    productDetails: [
      "Seamless Multi-Touch surface lets you perform gestures such as swiping between web pages and scrolling through documents.",
      "Internal rechargeable battery powers mouse for a month or more between charges.",
      "Pairs automatically with Mac computers out of the box via Bluetooth.",
    ],
  },
  {
    id: "apple-slim-keyboard",
    title: "Apple Magic Keyboard Slim Space Gray",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 193500,
    originalPrice: 223500,
    image: "/images/products/apple-slim-keyboard.jpg",
    tag: "Sleek",
    brand: "Apple",
    condition: "New",
    colors: ["Space Gray", "Silver"],
    description:
      "Ultra-thin wireless keyboard with scissor mechanism and long-lasting battery.",
    productDetails: [
      "Refined low-profile scissor mechanism beneath each key for enhanced stability and tactile key travel.",
      "Compact sleek aluminum enclosure matching Mac aesthetics.",
    ],
  },
  {
    id: "apple-studio-display",
    title: "Apple Studio Display 27-inch 5K",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 2398500,
    originalPrice: 2548500,
    image: "/images/products/apple-monitot.jpg",
    tag: "Pro Display",
    brand: "Apple",
    condition: "New",
    colors: ["Silver"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "27-inch 5K Retina display with 12MP Ultra Wide camera and six-speaker sound.",
    productDetails: [
      "27-inch 5K Retina display with 600 nits brightness, P3 wide color gamut, and 14.7 million pixels.",
      "12MP Ultra Wide camera with Center Stage for automatic framing during video conference calls.",
      "High-fidelity six-speaker sound system with force-cancelling woofers and Spatial Audio support.",
    ],
  },
  {
    id: "apple-watch-s9",
    title: "Apple Watch Series 9 (GPS)",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 598500,
    originalPrice: 643500,
    image: "/images/products/apple-watch.jpg",
    tag: "New",
    brand: "Apple",
    condition: "New",
    colors: ["Midnight", "Starlight", "Red"],
    description:
      "Double tap gesture support, brighter display, and advanced health sensors.",
    productDetails: [
      "S9 SiP enables double tap gesture control without touching the screen.",
      "Always-On Retina display with up to 2000 nits brightness (2x brighter than Series 8).",
      "ECG app, blood oxygen tracking, and temperature sensing for cycle tracking.",
    ],
  },
  {
    id: "samsung-watch-ultra",
    title: "Samsung Galaxy Watch Ultra Titanium",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 973500,
    originalPrice: 1048500,
    image: "/images/products/samsung-s9-watch-ultra.jpg",
    tag: "Rugged",
    brand: "Samsung",
    condition: "New",
    colors: ["Titanium Silver", "Titanium White"],
    description:
      "Rugged cushion frame smartwatch with dual-frequency GPS and 100m water resistance.",
    productDetails: [
      "Grade 4 titanium cushion frame built to withstand extreme temperatures and 10 ATM ocean diving.",
      "Dual-frequency GPS (L1+L5) for accurate outdoor tracking in dense urban areas or trail routes.",
      "BioActive Sensor monitoring heart rate, sleep apnea risk, and Vascular Age.",
    ],
  },
  {
    id: "d-link-router",
    title: "D-Link Smart Wi-Fi 6 Router",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 223500,
    originalPrice: 268500,
    image: "/images/products/d-link-router.jpg",
    brand: "D-Link",
    condition: "New",
    colors: ["Black"],
    description:
      "Dual-band AX1800 Wi-Fi 6 router with MU-MIMO and WPA3 security.",
    productDetails: [
      "Wi-Fi 6 (802.11ax) technology delivers speeds up to 1.8 Gbps (1200 Mbps on 5GHz + 574 Mbps on 2.4GHz).",
      "OFDMA and MU-MIMO technology reduces latency for heavy smart home device networks.",
      "WPA3 wireless encryption for enhanced network security.",
    ],
  },
  {
    id: "dell-32-monitor",
    title: "Dell 32-Inch UltraSharp 4K Monitor",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 1048500,
    originalPrice: 1198500,
    image: "/images/products/dell-32-inch-monitor.jpg",
    brand: "Dell",
    condition: "New",
    colors: ["Black", "Silver"],
    description:
      "4K UHD IPS display with USB-C hub connectivity and 99% sRGB color.",
    productDetails: [
      "31.5-inch 4K UHD (3840 x 2160) IPS panel with 99% sRGB color gamut coverage.",
      "Built-in USB-C hub providing up to 90W power delivery, Ethernet RJ45, and USB ports.",
      "ComfortView Plus built-in low blue light filter screen technology.",
    ],
  },
  {
    id: "dell-vertical-monitor",
    title: "Dell Ergonomic Vertical Display",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 583500,
    image: "/images/products/dell-vertical-monitor.jpg",
    brand: "Dell",
    condition: "Refurbished",
    colors: ["Black"],
    description:
      "Height-adjustable rotatable monitor optimized for programming and document editing.",
    productDetails: [
      "Fully ergonomic stand featuring 90-degree pivot rotatable orientation for vertical coding and reader view.",
      "Flicker-free anti-glare screen panel.",
    ],
  },
  {
    id: "fujifilm-xt5",
    title: "Fujifilm X-T5 Mirrorless Camera",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 2548500,
    originalPrice: 2848500,
    image: "/images/products/fujifilm-camera.jpg",
    tag: "Best Seller",
    brand: "Fujifilm",
    condition: "New",
    colors: ["Black", "Silver"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "40.2MP X-Trans CMOS 5 HR sensor with 7-stop in-body image stabilization.",
    productDetails: [
      "40.2-megapixel back-illuminated X-Trans CMOS 5 HR sensor paired with X-Processor 5.",
      "5-axis in-body image stabilization (IBIS) providing up to 7.0 stops of compensation.",
      "Dedicated physical control dials for ISO, shutter speed, and exposure compensation.",
      "19 Film Simulation modes reproducing classic Fujifilm analog film stocks.",
    ],
  },
  {
    id: "konica-c35",
    title: "Konica C35 Vintage Film Camera",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 373500,
    image: "/images/products/konica-camera.jpg",
    tag: "Vintage",
    brand: "Konica",
    condition: "Like New",
    colors: ["Silver", "Black"],
    description:
      "Classic 35mm rangefinder film camera with Hexanon 38mm f/2.8 lens.",
    productDetails: [
      "Sharp Hexanon 38mm f/2.8 4-element in 3-group optical lens.",
      "Automatic CD-cell light meter coupled exposure control.",
      "Compact lightweight mechanical body for street photography.",
    ],
  },
  {
    id: "jbl-quantum",
    title: "JBL Quantum Wireless Gaming Headset",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 298500,
    originalPrice: 343500,
    image: "/images/products/jbl-headset.jpg",
    brand: "JBL",
    condition: "New",
    colors: ["Black"],
    description:
      "Lossless 2.4GHz wireless headset with active noise cancellation and JBL QuantumSURROUND.",
    productDetails: [
      "JBL QuantumSURROUND audio engine creates multi-channel 3D spatial soundscapes.",
      "Lossless 2.4GHz wireless plus Bluetooth 5.2 dual wireless connection options.",
      "Voice-focus boom microphone with flip-up mute feature.",
    ],
  },
  {
    id: "shure-aonic-50",
    title: "Shure Aonic 50 Wireless Headset",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 448500,
    originalPrice: 523500,
    image: "/images/products/shure-headset.jpg",
    tag: "Premium",
    brand: "Shure",
    condition: "New",
    colors: ["Black", "Brown"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Studio-quality wireless sound with adjustable noise cancellation and Environment mode.",
    productDetails: [
      "Custom 50mm dynamic drivers engineered from decades of professional stage heritage.",
      "Adjustable Active Noise Cancellation eliminates distractions for true listening immersion.",
      "Environment Mode lets you hear the outside world with the flip of a switch.",
      "Up to 20 hours battery life with quick charge capability.",
    ],
  },
  {
    id: "sony-wh1000xm5",
    title: "Sony WH-1000XM5 Wireless Headphones",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 598500,
    originalPrice: 643500,
    image: "/images/products/sony-headphone.jpg",
    tag: "Top Rated",
    brand: "Sony",
    condition: "New",
    colors: ["Black", "Silver", "Blue"],
    isFeatured: true,
    isNewArrival: false,
    stock: 5,
    description:
      "Industry-leading noise canceling headphones with two processors and 8 microphones.",
    productDetails: [
      "Integrated Processor V1 and HD Noise Canceling Processor QN1 controlling 8 microphones.",
      "Ultra-clear hands-free calling with 4 beamforming microphones and AI noise reduction.",
      "Up to 30-hour battery life with quick charging (3 min charge = 3 hours playback).",
    ],
  },
  {
    id: "logitech-combo",
    title: "Logitech MK540 Wireless Keyboard & Mouse",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 118500,
    image: "/images/products/logitech-keyboard-mouse.jpg",
    brand: "Logitech",
    condition: "New",
    colors: ["Black"],
    description:
      "Full-size quiet wireless keyboard and contoured ambidextrous mouse.",
    productDetails: [
      "Logitech Unifying USB receiver connects both keyboard and mouse wirelessly.",
      "Spill-resistant keyboard design with palm rest and adjustable tilt legs.",
    ],
  },
  {
    id: "logitech-mx-keys",
    title: "Logitech MX Keys Wireless Illuminated Keyboard",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 178500,
    image: "/images/products/logitech-long-keyboard.jpg",
    brand: "Logitech",
    condition: "New",
    colors: ["Graphite"],
    description:
      "Tactile key switches with smart backlighting and multi-device Bluetooth switching.",
    productDetails: [
      "Perfect Stroke keys shaped for fingertips for fluid keypresses.",
      "Smart backlighting proximity sensors illuminate keys the moment your hands approach.",
      "Pair up to 3 devices and switch between them with Easy-Switch buttons.",
    ],
  },
  {
    id: "logitech-mx-master-3s",
    title: "Logitech MX Master 3S Wireless Mouse",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 148500,
    image: "/images/products/logitech-mouse.jpg",
    brand: "Logitech",
    condition: "New",
    colors: ["Black", "Pale Gray"],
    description:
      "8K DPI track-anywhere sensor with quiet click buttons and MagSpeed electromagnetic wheel.",
    productDetails: [
      "8000 DPI optical sensor tracks anywhere — even on glass surfaces.",
      "MagSpeed electromagnetic scrolling scrolls 1000 lines per second in near silence.",
      "Quiet Clicks technology eliminates 90% of click noise.",
    ],
  },
  {
    id: "techmanis-keyboard",
    title: "Techmanis Custom Mechanical Keyboard",
    categorySlug: "gadgets-accessories",
    categoryName: "Gadgets & Accessories",
    price: 193500,
    image: "/images/products/my-techmanis-keyboard.jpg",
    tag: "Crafted",
    brand: "Techmanis",
    condition: "New",
    colors: ["Black", "White"],
    description:
      "Hot-swappable mechanical keyboard with RGB backlighting and custom PBT keycaps.",
    productDetails: [
      "Hot-swappable PCB supporting 3-pin and 5-pin mechanical switches.",
      "Durable double-shot PBT keycaps with per-key RGB backlighting effects.",
    ],
  },

  // 3. Apparel & Fashion
  {
    id: "adidas-red-shirt",
    title: "Adidas Performance Red Tee",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 52500,
    originalPrice: 67500,
    image: "/images/products/adidas-red-shirt.jpg",
    brand: "Adidas",
    condition: "New",
    colors: ["Red"],
    isFeatured: false,
    isNewArrival: true,
    isSponsored: true,
    description: "Breathable AEROREADY athletic t-shirt for daily workouts.",
    productDetails: [
      "100% recycled polyester interlock with moisture-wicking AEROREADY technology.",
      "Regular athletic fit with crewneck collar design.",
    ],
  },
  {
    id: "adidas-white-polo",
    title: "Adidas Classic White Polo Shirt",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 73500,
    originalPrice: 88500,
    image: "/images/products/adidas-white-polo.jpg",
    brand: "Adidas",
    condition: "New",
    colors: ["White"],
    description:
      "Soft cotton blend polo shirt with three-stripe sleeve accent.",
    productDetails: [
      "70% cotton, 30% recycled polyester pique fabric.",
      "Three-button polo collar with ribbed cuffs.",
    ],
  },
  {
    id: "adidas-white-socks",
    title: "Adidas Cushioned Crew Socks 3-Pack",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 27000,
    image: "/images/products/adidas-white-socks.jpg",
    brand: "Adidas",
    condition: "New",
    colors: ["White"],
    description: "Arch support athletic crew socks with ribbed cuffs.",
    productDetails: [
      "Heel-to-toe cushioning for high-impact comfort.",
      "Linked toe seam for reduced friction.",
    ],
  },
  {
    id: "balenciaga-hoodie",
    title: "Balenciaga Oversized Cotton Hoodie",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 1125000,
    originalPrice: 1275000,
    image: "/images/products/balenciaga-hoodie.jpg",
    tag: "Luxury",
    brand: "Balenciaga",
    condition: "New",
    colors: ["Black"],
    isFeatured: true,
    isNewArrival: false,
    description:
      "Heavyweight French terry cotton hoodie with dropped shoulders and logo chest print.",
    productDetails: [
      "100% organic French terry cotton construction.",
      "Signature streetwear oversized drop-shoulder silhouette.",
      "Embroidered Balenciaga logo motif across chest and hood.",
      "Made in Portugal.",
    ],
  },
  {
    id: "brown-baseball-cap",
    title: "Vintage Brown Cotton Baseball Cap",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 42000,
    image: "/images/products/brown-baseball-cap.jpg",
    brand: "Heritage",
    condition: "New",
    colors: ["Brown"],
    description: "Unstructured 6-panel strapback hat in washed brown twill.",
    productDetails: [
      "Washed vintage cotton twill fabric.",
      "Adjustable brass buckle strapback enclosure.",
    ],
  },
  {
    id: "green-baseball-cap",
    title: "Outdoor Green Canvas Baseball Cap",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 42000,
    image: "/images/products/green-baseball-cap.jpg",
    brand: "Heritage",
    condition: "New",
    colors: ["Green"],
    description: "Durable cotton canvas cap with metal buckle closure.",
    productDetails: [
      "Heavyweight green canvas fabric with embroidered ventilation eyelets.",
    ],
  },
  {
    id: "nike-red-cap",
    title: "Nike Heritage Red Swoosh Cap",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 48000,
    image: "/images/products/nike-red-cap.jpg",
    tag: "Popular",
    brand: "Nike",
    condition: "New",
    colors: ["Red"],
    description: "Adjustable athletic cap with embroidered Nike Swoosh logo.",
    productDetails: [
      "Dri-FIT moisture wicking interior sweatband.",
      "Embroidered metallic Nike Swoosh logo on front panel.",
    ],
  },
  {
    id: "nike-air-blue-shirt",
    title: "Nike Air Blue Sport T-Shirt",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 63000,
    originalPrice: 73500,
    image: "/images/products/nike-air-blue-shirt.jpg",
    brand: "Nike",
    condition: "New",
    colors: ["Blue"],
    description:
      "Lightweight cotton activewear t-shirt featuring bold Nike Air chest graphic.",
    productDetails: [
      "Everyday cotton fabric soft and lightweight.",
      "Printed Nike Air chest graphic.",
    ],
  },
  {
    id: "nike-track-shirt",
    title: "Nike Dri-FIT Running Track Shirt",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 67500,
    image: "/images/products/nike-track-shirt.jpg",
    brand: "Nike",
    condition: "New",
    colors: ["Black", "Blue"],
    description: "Moisture-wicking mesh performance top for runners.",
    productDetails: [
      "Dri-FIT technology moves sweat away from your skin for faster evaporation.",
      "Reflective design elements for low-light visibility.",
    ],
  },
  {
    id: "nike-red-shoe",
    title: "Nike Air Zoom Red Running Shoes",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 208500,
    originalPrice: 238500,
    image: "/images/products/nike-red-shoe.jpg",
    tag: "Best Seller",
    brand: "Nike",
    condition: "New",
    colors: ["Red", "White"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Responsive Zoom Air cushioning with breathable Flyknit upper.",
    productDetails: [
      "Forefoot Air Zoom unit delivers responsive energy return with every stride.",
      "Breathable engineered mesh upper with Flywire cables for midfoot containment.",
      "Rubber waffle outsole for traction and longevity.",
    ],
  },
  {
    id: "nike-white-sneakers",
    title: "Nike Air Force 1 '07 White Sneakers",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 172500,
    image: "/images/products/nike-white-sneakers.jpg",
    tag: "Iconic",
    brand: "Nike",
    condition: "New",
    colors: ["White"],
    description:
      "Classic low-top leather sneakers with encapsulated Nike Air cushioning.",
    productDetails: [
      "Stitched leather overlays on the upper add heritage style and durability.",
      "Originally designed for performance hoops, Nike Air cushioning adds lightweight all-day comfort.",
      "Padded, low-cut collar looks sleek and feels comfortable.",
    ],
  },
  {
    id: "nike-socks",
    title: "Nike Everyday Ankle Socks 6-Pack",
    categorySlug: "fashion",
    categoryName: "Apparel & Fashion",
    price: 33000,
    image: "/images/products/nike-socks.jpg",
    brand: "Nike",
    condition: "New",
    colors: ["White", "Black"],
    description: "Dri-FIT technology ankle socks with targeted cushioning.",
    productDetails: [
      "Dri-FIT technology helps your feet stay dry and comfortable.",
      "Thick terry sole provides comfort and impact absorption.",
    ],
  },

  // 4. Furniture & Living
  {
    id: "scandinavian-dining-set",
    title: "Scandinavian Oak Dining Table & Chair Set",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 1273500,
    originalPrice: 1498500,
    image: "/images/products/dining-chair-and-table.jpg",
    tag: "Featured",
    brand: "Lawjun",
    condition: "New",
    colors: ["Natural Wood", "Brown"],
    isFeatured: true,
    isNewArrival: false,
    isSponsored: true,
    description:
      "Solid oak dining table paired with four ergonomic upholstered dining chairs.",
    productDetails: [
      "Crafted from 100% solid white oak with natural protective lacquer coating.",
      "Set includes 1 rectangular dining table and 4 padded ergonomic chairs.",
      "Stain-resistant upholstery fabric designed for easy cleaning.",
    ],
  },
  {
    id: "flower-chair",
    title: "Velvet Flower Petal Accent Chair",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 493500,
    originalPrice: 583500,
    image: "/images/products/flower-chair.jpg",
    tag: "Design",
    brand: "Lawjun",
    condition: "New",
    colors: ["Pink", "Gold"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Luxurious scalloped petal backrest arm chair with gold stainless steel legs.",
    productDetails: [
      "High-density foam padded scalloped backrest mimicking blooming flower petals.",
      "Soft velvet upholstery with electroplated gold stainless steel leg frame.",
    ],
  },
  {
    id: "ikea-table",
    title: "IKEA Scandinavian Minimalist Wooden Desk",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 283500,
    image: "/images/products/ikea-table.jpg",
    brand: "IKEA",
    condition: "New",
    colors: ["Birch", "White"],
    description:
      "Clean birch wood workstation table suitable for home offices.",
    productDetails: [
      "Durable solid birch wood surface with clear protective varnish finish.",
      "Pre-drilled leg holes for easy setup and wire management channel.",
    ],
  },
  {
    id: "lawjun-king-bed",
    title: "Lawjun Luxury Upholstered King Size Bed",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 1948500,
    originalPrice: 2248500,
    image: "/images/products/lawjun-king-size-bed.jpg",
    tag: "Premium",
    brand: "Lawjun",
    condition: "New",
    colors: ["Gray", "Beige"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Tufted linen headboard bed frame with reinforced slat support system.",
    productDetails: [
      "Button-tufted padded headboard upholstered in premium breathable linen fabric.",
      "Heavy-duty steel center support beam and noise-free wooden slats.",
    ],
  },
  {
    id: "lawjun-soft-chair",
    title: "Lawjun Soft Reading Armchair",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 598500,
    originalPrice: 688500,
    image: "/images/products/lawjun-soft-chair.jpg",
    brand: "Lawjun",
    condition: "New",
    colors: ["Cream", "Gray"],
    description:
      "Deep plush cushion lounge chair upholstered in stain-resistant fabric.",
    productDetails: [
      "Extra deep seating cushion filled with down-feather blend overlay.",
      "Solid hardwood internal frame built to last.",
    ],
  },
  {
    id: "palangolo-bed",
    title: "Palangolo Deluxe Queen Platform Bed",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 1648500,
    originalPrice: 1873500,
    image: "/images/products/palangolo-bed.jpg",
    brand: "Palangolo",
    condition: "New",
    colors: ["Brown", "Charcoal"],
    description:
      "Architectural padded platform bed frame with integrated side ledges.",
    productDetails: [
      "Low-profile platform structure featuring floating side shelf ledges.",
      "Integrated warm LED underbed ambient lighting strips.",
    ],
  },
  {
    id: "bistro-dining-set",
    title: "Bistro Wooden Dining Table Set",
    categorySlug: "furniture",
    categoryName: "Furniture & Living",
    price: 748500,
    image: "/images/products/restaurant-chair-and-table.jpg",
    brand: "Lawjun",
    condition: "Like New",
    colors: ["Brown", "Black"],
    description:
      "Compact dining table set perfect for apartments and breakfast nooks.",
    productDetails: [
      "Space-saving 3-piece dining set with tuck-in curved chairs.",
      "Waterproof heat-resistant tabletop finish.",
    ],
  },

  // 5. Beauty & Care
  {
    id: "necessaire-lotion",
    title: "Nécessaire The Body Lotion 250ml",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 42000,
    image: "/images/products/necessaire-body-lotion.jpg",
    tag: "Clean Beauty",
    brand: "Nécessaire",
    condition: "New",
    colors: ["White"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Multivitamin body moisturizer infused with niacinamide, marula oil, and peptides.",
    productDetails: [
      "Formulated with Niacinamide (Vitamin B3), Vitamin C, Vitamin E, and Omega-6/9.",
      "Fragrance-free formula ideal for sensitive skin.",
      "100% Climate Neutral Certified packaging.",
    ],
  },
  {
    id: "nivea-body-milk",
    title: "Nivea Rich Nourishing Body Milk 400ml",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 21000,
    image: "/images/products/nivea-body-milk.jpg",
    brand: "Nivea",
    condition: "New",
    colors: ["Blue"],
    description:
      "Intense 48-hour moisture lotion enriched with Deep Moisture Serum and Almond Oil.",
    productDetails: [
      "Enriched with 2x natural Almond Oil to intensely nourish dry skin.",
      "Provides 48 hours of continuous deep hydration.",
    ],
  },
  {
    id: "nivea-body-spray",
    title: "Nivea Fresh Comfort Deodorant Spray",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 13500,
    image: "/images/products/nivea-body-spray.jpg",
    brand: "Nivea",
    condition: "New",
    colors: ["White", "Blue"],
    description:
      "48-hour anti-perspirant protection with refreshing ocean extracts.",
    productDetails: [
      "48-hour effective antiperspirant protection.",
      "Formulated with refreshing ocean extracts.",
    ],
  },
  {
    id: "nivea-chapsticks",
    title: "Nivea Essential Lip Care Chapstick 3-Pack",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 18000,
    image: "/images/products/nivea-chap-sticks.jpg",
    brand: "Nivea",
    condition: "New",
    colors: ["Blue", "Red"],
    description:
      "Moisturizing lip balms formulated with Shea Butter and natural jojoba oils.",
    productDetails: [
      "Contains 100% natural ingredients including Shea Butter and organic Jojoba Oil.",
      "Prevents chapped lips in cold or dry conditions.",
    ],
  },
  {
    id: "ordinary-care-set",
    title: "The Ordinary Daily Skincare Essentials Set",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 57000,
    originalPrice: 67500,
    image: "/images/products/ordinaru-care-set.jpg",
    tag: "Trending",
    brand: "The Ordinary",
    condition: "New",
    colors: ["Clear", "White"],
    isFeatured: true,
    description:
      "Complete facial routine featuring Squalane Cleanser, Hyaluronic Acid, and Niacinamide.",
    productDetails: [
      "Includes 3 full-size products: Squalane Cleanser 50ml, Hyaluronic Acid 2% + B5 30ml, and Niacinamide 10% + Zinc 1% 30ml.",
      "Vegan, cruelty-free, silicone-free, and oil-free daily facial regimen.",
    ],
  },
  {
    id: "vaseline-moisturizer",
    title: "Vaseline Intensive Care Cocoa Glow Lotion",
    categorySlug: "beauty-care",
    categoryName: "Beauty & Care",
    price: 16500,
    image: "/images/products/vaseline-mosturizer.jpg",
    brand: "Vaseline",
    condition: "New",
    colors: ["Brown", "Gold"],
    description:
      "100% pure cocoa butter lotion for glowing, deeply hydrated skin.",
    productDetails: [
      "Infused with 100% pure Cocoa Butter and Ultra-Hydrating Lipids.",
      "Restores dry skin for radiant, glowing skin without greasy residue.",
    ],
  },

  // 6. Groceries
  {
    id: "fresh-tomatoes",
    title: "Fresh Farm Organic Red Tomatoes (1kg)",
    categorySlug: "groceries",
    categoryName: "Groceries",
    price: 9000,
    image: "/images/products/fresh-farm-organic-tomatoes.jpg",
    tag: "Organic",
    brand: "Fresh Farm",
    condition: "New",
    colors: ["Red"],
    isFeatured: true,
    isNewArrival: false,
    description:
      "Vine-ripened organic red tomatoes harvested daily from local farms.",
    productDetails: [
      "Certified 100% organic pesticide-free tomatoes.",
      "Harvested daily for maximum freshness and flavor.",
    ],
  },
  {
    id: "lawjun-cereal",
    title: "Lawjun Whole Grain Breakfast Cereal 500g",
    categorySlug: "groceries",
    categoryName: "Groceries",
    price: 12000,
    image: "/images/products/lawjun-cereal.jpg",
    brand: "Lawjun",
    condition: "New",
    colors: ["Brown"],
    description:
      "Crispy toasted whole grain cereal enriched with essential vitamins and fiber.",
    productDetails: [
      "Made with 100% whole grain oats and wheat flakes.",
      "Fortified with Iron, B-Vitamins, and Zinc.",
    ],
  },
  {
    id: "nestle-milo",
    title: "Nestle Milo Chocolate Malt Beverage Powder 800g",
    categorySlug: "groceries",
    categoryName: "Groceries",
    price: 22500,
    image: "/images/products/milo-beverage.avif",
    tag: "Pantry",
    brand: "Nestle",
    condition: "New",
    colors: ["Green"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Iconic energy chocolate malt drink mix packed with Activ-Go nutrients.",
    productDetails: [
      "Formulated with Activ-Go: 6 vitamins and 3 minerals for sustained energy release.",
      "Made from malted barley, milk, and cocoa.",
    ],
  },

  // 7. Home Appliances
  {
    id: "google-tv",
    title: "Google Android Smart TV 55-inch 4K UHD",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 823500,
    originalPrice: 973500,
    image: "/images/products/google-android-television.jpg",
    tag: "Smart Home",
    brand: "Google",
    condition: "New",
    colors: ["Black"],
    isFeatured: true,
    isNewArrival: false,
    description:
      "HDR10+ Android TV with Google Assistant voice control and Chromecast built-in.",
    productDetails: [
      "55-inch 4K UHD (3840 x 2160) LED display panel supporting HDR10+ and HLG.",
      "Google TV OS with personalized recommendations and Google Assistant voice remote.",
      "Built-in Chromecast allows seamless casting from iOS and Android devices.",
    ],
  },
  {
    id: "samsung-slim-tv",
    title: "Samsung Crystal UHD 65-inch Slim Smart TV",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 1198500,
    originalPrice: 1348500,
    image: "/images/products/samsung-slim-tv.jpg",
    tag: "Top Rated",
    brand: "Samsung",
    condition: "New",
    colors: ["Black"],
    isFeatured: false,
    isNewArrival: true,
    description:
      "Ultra-slim AirSlim design 4K processor TV with Smart Hub streaming.",
    productDetails: [
      "AirSlim profile with virtually bezel-less 3-side aesthetic.",
      "Crystal Processor 4K upscales non-4K content to near-4K picture quality.",
      "Object Tracking Sound Lite (OTS Lite) for dynamic 3D audio.",
    ],
  },
  {
    id: "horizon-ac",
    title: "Horizon Inverter Split Air Conditioner 1.5 HP",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 748500,
    originalPrice: 868500,
    image: "/images/products/horizon-air-conditioner.jpg",
    brand: "Horizon",
    condition: "New",
    colors: ["White"],
    description:
      "Rapid cooling eco inverter AC unit with anti-bacterial air filtration.",
    productDetails: [
      "Full DC Inverter technology saving up to 60% energy compared to standard compressor units.",
      "Triple action anti-bacterial and HD dust air filtration system.",
    ],
  },
  {
    id: "lawjun-washer",
    title: "Lawjun Front Load Washing Machine 8kg",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 673500,
    originalPrice: 778500,
    image: "/images/products/lawjun-washing-machine.jpg",
    brand: "Lawjun",
    condition: "New",
    colors: ["White", "Silver"],
    description:
      "Direct drive inverter washer with 14 wash programs and steam hygiene cycle.",
    productDetails: [
      "8kg capacity drum equipped with Inverter Direct Drive motor for quiet operation.",
      "Steam Hygiene cycle kills 99.9% of bacteria and allergens.",
    ],
  },
  {
    id: "planetcare-washer",
    title: "PlanetCare Eco Washing Machine",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 793500,
    image: "/images/products/planetcare-washing-machine.jpg",
    tag: "Eco Friendly",
    brand: "PlanetCare",
    condition: "New",
    colors: ["White"],
    description:
      "Energy-efficient washing machine equipped with microfibre filtration system.",
    productDetails: [
      "Integrated microfibre filter captures synthetic microplastics before water discharge.",
      "A+++ energy efficiency rating.",
    ],
  },
  {
    id: "compact-microwave",
    title: "Compact Digital Microwave Oven 20L",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 178500,
    originalPrice: 208500,
    image: "/images/products/microwave.jpg",
    brand: "Lawjun",
    condition: "New",
    colors: ["Silver", "Black"],
    description:
      "700W countertop microwave with touch control panel and 8 auto cooking menus.",
    productDetails: [
      "20L interior capacity with glass turntable tray.",
      "700W power output with 5 power levels and defrost settings.",
    ],
  },
  {
    id: "retro-mini-fridge",
    title: "Retro Countertop Mini Fridge 45L",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 283500,
    originalPrice: 328500,
    image: "/images/products/mini-fridge.jpg",
    brand: "Heritage",
    condition: "New",
    colors: ["Red", "Cream"],
    description:
      "Vintage style compact refrigerator with chiller compartment and adjustable thermostat.",
    productDetails: [
      "45L total capacity featuring retro chrome door handle accent.",
      "Includes 5L top freezer/chiller compartment for ice trays.",
    ],
  },
  {
    id: "mercedes-collector-scale",
    title: "Mercedes Benz Collector Scale Model",
    categorySlug: "appliances",
    categoryName: "Home Appliances",
    price: 238500,
    image: "/images/products/stuggart-mercedes.jpg",
    brand: "Mercedes",
    condition: "New",
    colors: ["Silver", "Black"],
    description:
      "Precision engineered die-cast collector scale model with working doors and interior details.",
    productDetails: [
      "1:18 scale die-cast zinc alloy metal replica body.",
      "Functional steering wheel, opening doors, hood, and trunk with plush lined interior.",
    ],
  },
];

const BRAND_TO_STORE_MAP: Record<string, string> = {
  "Google": "alex-tech",
  "Xiaomi": "alex-tech",
  "Samsung": "alex-tech",
  "Apple": "alex-tech",
  "Dell": "alex-tech",
  "Logitech": "alex-tech",
  "Techmanis": "alex-tech",
  "D-Link": "alex-tech",
  
  "Sony": "alex-tech",
  "JBL": "alex-tech",
  "Shure": "alex-tech",
  
  "Balenciaga": "sophia-fashion",
  "Adidas": "sophia-fashion",
  "Nike": "sophia-fashion",
  
  "Lawjun": "sophia-fashion",
  "IKEA": "emma-lifestyle",
  "Palangolo": "sophia-fashion",
  
  "Nécessaire": "emma-lifestyle",
  "Nivea": "emma-lifestyle",
  "The Ordinary": "emma-lifestyle",
  "Vaseline": "emma-lifestyle",
  
  "Fresh Farm": "greenhouse",
  "Nestle": "greenhouse",
  
  "Fujifilm": "marcus-collective",
  "Konica": "marcus-collective",
  "Heritage": "marcus-collective",
  
  "Horizon": "greenhouse",
  "PlanetCare": "emma-lifestyle",
  "Mercedes": "greenhouse"
};

// Programmatic mapping of storeId to products
PRODUCTS_DATA.forEach(product => {
  if (!product.storeId && product.brand) {
    product.storeId = BRAND_TO_STORE_MAP[product.brand] || "beembai-official";
  }
});

// Assign first 2 products of each category slug to beembai-official to guarantee it sells items from all categories
const CATEGORIES_LIST = ["phones-tablets", "gadgets-accessories", "fashion", "furniture", "beauty-care", "groceries", "appliances"];
CATEGORIES_LIST.forEach((slug) => {
  const matches = PRODUCTS_DATA.filter(p => p.categorySlug === slug);
  matches.slice(0, 2).forEach(p => {
    p.storeId = "beembai-official";
  });
});

// Helper Functions
export const getAllCategories = (): Category[] => CATEGORIES_DATA;

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return CATEGORIES_DATA.find((cat) => cat.slug === slug);
};

export const getProductsByCategory = (categorySlug: string): Product[] => {
  return PRODUCTS_DATA.filter(
    (product) => product.categorySlug === categorySlug,
  );
};

export const getProductById = (id: string): Product | undefined => {
  return PRODUCTS_DATA.find((product) => product.id === id);
};

export const getFeaturedProducts = (): Product[] => {
  return PRODUCTS_DATA.filter((product) => product.isFeatured);
};

export const getNewArrivalsProducts = (): Product[] => {
  return PRODUCTS_DATA.filter((product) => product.isNewArrival);
};

export const STORES_DATA: Store[] = [
  {
    id: "beembai-official",
    name: "Beembai Official Store",
    slug: "beembai-official",
    logo: "",
    banner: "/images/stores/beembai-official store.jpg",
    rating: 5.0,
    verified: true,
    category: "All Categories",
    description: "The official Beembai marketplace outlet. Sourcing premium certified items directly from top global manufacturers across all lifestyle, technology, and home categories.",
    bannerMessage: "Authentic global quality with official Beembai 1-Year replacement warranty."
  },
  {
    id: "alex-tech",
    name: "Alex's Tech Spot",
    slug: "alex-tech-spot",
    logo: "", // clear logos to test fallback initials
    banner: "/images/stores/alex-tech-store.jpg",
    rating: 4.9,
    verified: true,
    category: "Phone & Tablets",
    description: "Curated premium gadgets and gear. I specialize in Pixel phones, iPads, active noise-canceling headphones, and custom mechanical keyboards.",
    bannerMessage: "Top-rated personal setup essentials, backed by local seller warranty support."
  },
  {
    id: "sophia-fashion",
    name: "Sophia's Fashion & Design",
    slug: "sophia-fashion-design",
    logo: "",
    banner: "/images/stores/sophia-fashion.jpg",
    rating: 4.8,
    verified: true,
    category: "Apparel & Fashion",
    description: "Bespoke platform platform beds, scalloped velvet chairs, and high-fashion cotton hoodies curated to elevate your personal style and space.",
    bannerMessage: "Elevate your look and your living space with my exclusive design imports."
  },
  {
    id: "greenhouse",
    name: "Greenhouse Market",
    slug: "greenhouse-market",
    logo: "",
    banner: "/images/stores/greenhouse-market.jpg",
    rating: 4.7,
    verified: false,
    category: "Groceries",
    description: "Sourcing certified organic farm-fresh tomatoes, milo beverage powders, and clean eco-friendly washing machines for a sustainable home.",
    bannerMessage: "Farm-to-table groceries and green appliances for modern eco-friendly living."
  },
  {
    id: "emma-lifestyle",
    name: "Emma's Lifestyle Studio",
    slug: "emma-lifestyle-studio",
    logo: "",
    banner: "/images/stores/emma-liifestyle.jpg",
    rating: 4.8,
    verified: true,
    category: "Beauty & Care",
    description: "Clean organic body lotions, multivitamin skincare sets, space-saving wooden work desks, and professional studio display monitors.",
    bannerMessage: "Daily self-care, minimal office setups, and productivity tools all in one shop."
  },
  {
    id: "marcus-collective",
    name: "Marcus Collective",
    slug: "marcus-collective",
    logo: "",
    banner: "/images/stores/marcus-collective.jpg",
    rating: 4.6,
    verified: true,
    category: "Gadgets & Accessories",
    description: "A unique mix of vintage rangefinder film cameras, performance running shoes, smart split inverter ACs, and compact digital microwaves.",
    bannerMessage: "Hand-selected vintage camera gear and everyday home utilities."
  }
];

export const getAllStores = (): Store[] => STORES_DATA;

export const getStoreById = (id: string): Store | undefined => {
  return STORES_DATA.find((store) => store.id === id);
};

export const getStoreBySlug = (slug: string): Store | undefined => {
  return STORES_DATA.find((store) => store.slug === slug);
};

export const getProductsByStore = (storeId: string): Product[] => {
  return PRODUCTS_DATA.filter((product) => product.storeId === storeId);
};
