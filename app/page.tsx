"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./page.module.css";
import {
  getFeaturedProducts,
  getNewArrivalsProducts,
  Product,
  PRODUCTS_DATA,
  CATEGORIES_DATA,
  formatPrice,
  formatNumber,
} from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";
import ProductCard from "@/app/components/ProductCard";
import Navbar from "@/app/components/Navbar";

// SVG Components
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 2h2.5l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6l1.7-8.4H5.5"
    />
    <circle cx="9" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const StarFilledIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const StarEmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
    />
  </svg>
);

const TruckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h2"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const LeafIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

interface AdvertSlide {
  id: string;
  type: "in-app" | "product" | "brand";
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  isTransparentImage?: boolean;
  isLightSlide?: boolean;
  ctaText: string;
  ctaLink: string;
  price?: number;
  originalPrice?: number;
  bgGradient: string;
}

const ADVERT_SLIDES: AdvertSlide[] = PRODUCTS_DATA.filter(
  (p) => p.isSponsored,
).map((product, index) => {
  const gradients = [
    "linear-gradient(135deg, #241c0e 0%, #3d2f16 50%, #140f07 100%)",
    "linear-gradient(135deg, #160f26 0%, #2b1747 50%, #0c0716 100%)",
    "linear-gradient(135deg, #0e192b 0%, #1a2f4c 50%, #080f1a 100%)",
    "linear-gradient(135deg, #1c1813 0%, #332a1e 50%, #110e0a 100%)",
  ];
  return {
    id: product.id,
    type: "product" as const,
    tag: "Sponsored",
    title: product.title,
    subtitle: product.description || "",
    image: product.image,
    imageAlt: `${product.title} Showcase`,
    ctaText: `Shop ${product.brand || ""}`,
    ctaLink: `/product/${product.id}`,
    price: product.price,
    originalPrice: product.originalPrice,
    bgGradient: gradients[index % gradients.length],
  };
});

const CATEGORIES = [
  "All",
  "Electronics",
  "Audio",
  "Accessories",
  "Wearables",
  "Appliances",
];

interface PopularCategory {
  id: string;
  slug: string;
  name: string;
  image: string;
  filterValue: string;
}

const POPULAR_CATEGORIES_DATA: PopularCategory[] = [
  {
    id: "gadgets",
    slug: "phones-tablets",
    name: "Phone & Tablets",
    image: "/images/categories/gadgets.jpg",
    filterValue: "Electronics",
  },
  {
    id: "audio",
    slug: "gadgets-accessories",
    name: "Gadget & Accessories",
    image: "/images/categories/gadgets3.jpg",
    filterValue: "Audio",
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Apparel & Fashion",
    image: "/images/categories/shirt.jpg",
    filterValue: "All",
  },
  {
    id: "furniture",
    slug: "furniture",
    name: "Furniture & Living",
    image: "/images/categories/furniture.jpg",
    filterValue: "Accessories",
  },
  {
    id: "beauty",
    slug: "beauty-care",
    name: "Beauty & Care",
    image: "/images/categories/beauty-care.jpg",
    filterValue: "All",
  },
  {
    id: "wearables",
    slug: "groceries",
    name: "Groceries",
    image: "/images/categories/groceries.jpg",
    filterValue: "Wearables",
  },
  {
    id: "appliances",
    slug: "appliances",
    name: "Home Appliances",
    image: "/images/categories/home.jpg",
    filterValue: "Appliances",
  },
];

export default function Home() {
  const { totalItemsCount, addToCart, cartBounce } = useCart();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const featuredRowRef = useRef<HTMLDivElement>(null);
  const categoryRowRef = useRef<HTMLDivElement>(null);

  const dbProducts = useQuery(api.products.getProducts);

  // Helper mapper to normalize db product details
  const mapDbProduct = (p: any) => ({
    id: p._id,
    title: p.title,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    categorySlug: p.categorySlug,
    categoryName: p.categoryName,
    colors: p.colors,
    description: p.description,
    tag: p.tag,
    stock: p.stock,
    storeId: p.storeId,
    images: p.images,
    youtubeLink: p.youtubeLink,
    status: p.status,
    brand: p.brand,
    condition: p.condition || "New",
  });

  const advertSlides = useMemo(() => {
    if (!dbProducts) return [];
    const sponsored = dbProducts.filter((p) => p.isSponsored);
    if (sponsored.length === 0) return [];
    
    return sponsored.map((product, index) => {
      const gradients = [
        "linear-gradient(135deg, #241c0e 0%, #3d2f16 50%, #140f07 100%)",
        "linear-gradient(135deg, #160f26 0%, #2b1747 50%, #0c0716 100%)",
        "linear-gradient(135deg, #0e192b 0%, #1a2f4c 50%, #080f1a 100%)",
        "linear-gradient(135deg, #1c1813 0%, #332a1e 50%, #110e0a 100%)",
      ];
      return {
        id: product._id,
        type: "product" as const,
        tag: "Sponsored",
        title: product.title,
        subtitle: product.description || "",
        image: product.image,
        imageAlt: `${product.title} Showcase`,
        ctaText: `Shop ${product.brand || ""}`,
        ctaLink: `/product/${product._id}`,
        price: product.price,
        originalPrice: product.originalPrice,
        bgGradient: gradients[index % gradients.length],
        isLightSlide: false,
        isTransparentImage: false,
      };
    });
  }, [dbProducts]);

  const activeSlides = advertSlides.length > 0 ? advertSlides : ADVERT_SLIDES;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("beembai_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase(),
      );
      const updated = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(
          "beembai_recent_searches",
          JSON.stringify(updated),
        );
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("beembai_recent_searches");
    } catch (e) {
      console.error(e);
    }
  };

  const trendingKeywords = [
    "Pixel 10",
    "AirPods",
    "Sony",
    "Vintage Camera",
    "Balenciaga",
    "OLED",
  ];

  // Debounce: only update debouncedQuery 350ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Live Convex search using the full-text index
  const searchResults = useQuery(
    api.products.searchProducts,
    debouncedQuery ? { query: debouncedQuery } : "skip",
  );

  const searchMatchingProducts = searchResults ?? [];

  const scrollFeatured = (direction: "left" | "right") => {
    if (!featuredRowRef.current) return;
    const container = featuredRowRef.current;
    const cardWidth = container.firstElementChild?.clientWidth || 280;
    const scrollAmount =
      direction === "left" ? -(cardWidth + 24) : cardWidth + 24;
    try {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } catch {
      container.scrollLeft += scrollAmount;
    }
  };

  const scrollCategory = (direction: "left" | "right") => {
    if (!categoryRowRef.current) return;
    const container = categoryRowRef.current;
    const itemWidth = container.firstElementChild?.clientWidth || 95;
    const scrollAmount =
      direction === "left" ? -(itemWidth * 2 + 16) : itemWidth * 2 + 16;
    try {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } catch {
      container.scrollLeft += scrollAmount;
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    const shopElement = document.getElementById("shop");
    if (shopElement) {
      shopElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Apply theme to document element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Auto-advance advert slides every 15 seconds
  React.useEffect(() => {
    if (!isAutoPlaying || activeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeSlides.length]);

  const handlePrevSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlideIndex(
      (prev) => (prev - 1 + activeSlides.length) % activeSlides.length,
    );
  };

  const handleNextSlide = () => {
    if (activeSlides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };



  // Featured products (horizontal line fetched from database with mock fallback)
  const featuredProducts = useMemo(() => {
    if (!dbProducts) return getFeaturedProducts();
    const dbFeatured = dbProducts.filter((p) => p.isFeatured).map(mapDbProduct);
    return dbFeatured.length > 0 ? dbFeatured : getFeaturedProducts();
  }, [dbProducts]);

  // New arrivals (fetched from database with mock fallback)
  const newArrivalsProducts = useMemo(() => {
    if (!dbProducts) return getNewArrivalsProducts();
    const dbNew = dbProducts.filter((p) => p.isNewArrival).map(mapDbProduct);
    return dbNew.length > 0 ? dbNew : getNewArrivalsProducts();
  }, [dbProducts]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setSubscribed(true);
      setSubscribeEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      {/* Dark Transparent Backdrop Overlay */}
      <div
        className={`${styles.searchOverlay} ${isSearchFocused ? styles.searchOverlayActive : ""}`}
        onClick={() => setIsSearchFocused(false)}
      />

      {/* Prominent Sub-Header Search Bar Row */}
      <div
        className={`${styles.subHeaderSearchRow} ${
          isSearchFocused ? styles.subHeaderSearchRowActive : ""
        }`}
      >
        <div className={styles.subHeaderSearchBarWrapper}>
          <div
            className={`${styles.subHeaderSearchBar} ${
              isSearchFocused ? styles.subHeaderSearchBarActive : ""
            }`}
          >
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchFocused) setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchFocused(false);
                } else if (e.key === "Enter" && searchQuery.trim()) {
                  saveRecentSearch(searchQuery);
                  setIsSearchFocused(false);
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className={styles.subHeaderSearchInput}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={styles.searchClearBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className={styles.searchShortcutHint}>Search</span>
            )}
          </div>

          {/* Live On-Type Suggestions Dropdown Modal */}
          {isSearchFocused && (
            <div className={styles.searchSuggestionsDropdown}>
              {searchQuery.trim() === "" ? (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className={styles.suggestionGroup}>
                      <div className={styles.suggestionSectionTitle}>
                        <span>Recent Searches</span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className={styles.clearRecentBtn}
                        >
                          Clear
                        </button>
                      </div>
                      <div className={styles.chipsRow}>
                        {recentSearches.map((term) => (
                          <button
                            type="button"
                            key={term}
                            onClick={() => {
                              setSearchQuery(term);
                              saveRecentSearch(term);
                            }}
                            className={styles.keywordChip}
                          >
                            <span>🕒</span>
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  <div className={styles.suggestionGroup}>
                    <div className={styles.suggestionSectionTitle}>
                      <span>🔥 Trending Searches</span>
                    </div>
                    <div className={styles.chipsRow}>
                      {trendingKeywords.map((kw) => (
                        <button
                          type="button"
                          key={kw}
                          onClick={() => {
                            setSearchQuery(kw);
                            saveRecentSearch(kw);
                          }}
                          className={styles.keywordChip}
                        >
                          <span>{kw}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Categories */}
                  <div className={styles.suggestionGroup}>
                    <div className={styles.suggestionSectionTitle}>
                      <span>Browse Categories</span>
                    </div>
                    <div className={styles.chipsRow}>
                      {CATEGORIES_DATA.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          onClick={() => setIsSearchFocused(false)}
                          className={styles.keywordChip}
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Active Live Matching Suggestions (Convex full-text search) */
                <div className={styles.suggestionGroup}>
                  <div className={styles.suggestionSectionTitle}>
                    <span>
                      {searchResults === undefined && debouncedQuery
                        ? "Searching..."
                        : `Matching Products (${searchMatchingProducts.length})`}
                    </span>
                  </div>

                  {searchResults === undefined && debouncedQuery ? (
                    <div className={styles.noMatchesText}>Loading suggestions…</div>
                  ) : searchMatchingProducts.length > 0 ? (
                    <>
                      <div className={styles.productSuggestionList}>
                        {searchMatchingProducts.slice(0, 5).map((product) => (
                          <Link
                            key={product._id}
                            href={`/product/${product._id}`}
                            onClick={() => {
                              saveRecentSearch(product.title);
                              setIsSearchFocused(false);
                            }}
                            className={styles.productSuggestionRow}
                          >
                            <div className={styles.suggestionImgWrapper}>
                              <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                className={styles.suggestionImg}
                                sizes="44px"
                              />
                            </div>

                            <div className={styles.suggestionInfo}>
                              <span className={styles.suggestionTitle}>
                                {product.title}
                              </span>
                              <span className={styles.suggestionMeta}>
                                {product.brand ? `${product.brand} • ` : ""}
                                {product.categoryName}
                              </span>
                            </div>

                            <span className={styles.suggestionPrice}>
                              ₦{formatPrice(product.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => {
                          saveRecentSearch(searchQuery);
                          setIsSearchFocused(false);
                        }}
                        className={styles.viewAllResultsBtn}
                      >
                        View all {searchMatchingProducts.length} results for &ldquo;{searchQuery}&rdquo; →
                      </Link>
                    </>
                  ) : (
                    <div className={styles.noMatchesText}>
                      No products found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Advert Showcase Section (Border-Radius All Round) */}
      <section
        className={styles.heroAdvertSection}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className={styles.advertTrack}>
          {activeSlides.map((slide, index) => (
            <Link
              href={slide.ctaLink}
              key={slide.id}
              className={`${styles.advertSlide} ${index === currentSlideIndex ? styles.advertSlideActive : ""} ${slide.isLightSlide ? styles.lightAdvertSlide : ""}`}
              style={{ background: slide.bgGradient }}
            >
              <div className={styles.advertSlideInner}>
                <div className={styles.advertContent}>
                  <div className={styles.advertTagBadge}>
                    <SparklesIcon />
                    <span>{slide.tag}</span>
                  </div>

                  <h1 className={styles.advertTitle}>{slide.title}</h1>
                  <p className={styles.advertSubtitle}>{slide.subtitle}</p>

                  <div className={styles.advertActions}>
                    <span className={styles.advertCtaBtn}>{slide.ctaText}</span>
                    {slide.price && (
                      <div className={styles.advertPriceBadge}>
                        <span className={styles.advertCurrentPrice}>
                          ₦{formatPrice(slide.price)}
                        </span>
                        {slide.originalPrice && (
                          <span className={styles.advertOriginalPrice}>
                            ₦{formatPrice(slide.originalPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.advertVisual}>
                  <div
                    className={`${styles.advertImageContainer} ${slide.isTransparentImage ? styles.transparentImgContainer : ""}`}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.imageAlt}
                      fill
                      priority={true}
                      className={
                        slide.isTransparentImage
                          ? styles.transparentAdImg
                          : styles.cardAdImg
                      }
                      sizes="(max-width: 768px) 100vw, 45vw"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Banner Bottom Controls: Dots + Flex-End Next/Prev Navigation */}
        <div className={styles.bannerBottomRow}>
          <div className={styles.carouselDots}>
            {activeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlideIndex(index)}
                className={`${styles.carouselDot} ${index === currentSlideIndex ? styles.carouselDotActive : ""}`}
                aria-label={`Go to advert ${index + 1}`}
              />
            ))}
          </div>

          <div className={styles.bannerEndNavControls}>
            <button
              type="button"
              onClick={handlePrevSlide}
              className={styles.bannerEndNavBtn}
              aria-label="Previous Advert"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className={styles.bannerEndNavBtn}
              aria-label="Next Advert"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </section>

      {/* Explore Popular Categories Section - Single Line Circular Layout */}
      <section className={styles.popularCategoriesSection}>
        <div className={styles.popularCategoriesHeader}>
          <div className={styles.popularCategoriesTitleGroup}>
            <span className={styles.popularCategoriesTag}>
              Curated Categories
            </span>
            <h2 className={styles.popularCategoriesTitle}>
              Explore Popular Categories
            </h2>
          </div>

          {/* Snap Scroll Navigation Controls */}
          <div className={styles.categoryNavControls}>
            <button
              type="button"
              onClick={() => scrollCategory("left")}
              className={styles.categoryNavBtn}
              aria-label="Scroll Previous Categories"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => scrollCategory("right")}
              className={styles.categoryNavBtn}
              aria-label="Scroll Next Categories"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <div ref={categoryRowRef} className={styles.circleCategoriesRow}>
          {POPULAR_CATEGORIES_DATA.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={styles.circleCategoryItem}
            >
              <div className={styles.circleImageWrapper}>
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className={styles.circleImg}
                  sizes="120px"
                />
                <div className={styles.circleHoverOverlay} />
              </div>
              <span className={styles.circleCategoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section (Horizontal Line) */}
      <section id="featured" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Handpicked Showcase</span>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <p className={styles.sectionSubtitle}>
            Discover our most sought-after signature tech & workspace
            essentials.
          </p>
        </div>

        <div ref={featuredRowRef} className={styles.featuredHorizontalRow}>
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cardStyle={{ minWidth: "280px", maxWidth: "280px" }}
              imageSizes="(max-width: 768px) 100vw, 280px"
            />
          ))}
        </div>

        {/* Snap Scroll Navigation Controls */}
        <div className={styles.featuredNavControls}>
          <button
            type="button"
            onClick={() => scrollFeatured("left")}
            className={styles.featuredNavBtn}
            aria-label="Scroll Previous Featured Products"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => scrollFeatured("right")}
            className={styles.featuredNavBtn}
            aria-label="Scroll Next Featured Products"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </section>

      {/* New Arrivals Section (3x3 Grid) */}
      <section
        id="shop"
        className={styles.section}
        style={{ paddingTop: "1rem" }}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Latest Drops</span>
          <h2 className={styles.sectionTitle}>New Arrivals</h2>
          <p className={styles.sectionSubtitle}>
            Explore the newest additions to the beembai ecosystem.
          </p>
        </div>

        <div className={styles.newArrivalsGrid}>
          {newArrivalsProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Sell on Beembai / Showcase Banner */}
      <section id="sell-promo" className={styles.promoSection}>
        <div className={styles.promoContent}>
          <span className={styles.promoTag}>Become a Seller</span>
          <h2 className={styles.promoTitle}>
            Start Selling Very Easily on Beembai.
          </h2>
          <p className={styles.promoDescription}>
            Reach thousands of shoppers looking for tech, lifestyle, groceries,
            home appliances, and more. Set up your custom storefront account in
            minutes, organize items into dynamic category tabs, and scale your
            business with zero complex setups.
          </p>
          <Link href="/sell" className={styles.promoBtn}>
            Open Your Store
          </Link>
        </div>
        <div className={styles.promoVisual}>
          <div className={styles.promoImageWrapper}>
            <Image
              src="/images/stores/sell-banner.jpg"
              alt="Beembai Seller Marketplace"
              fill
              className={styles.promoImg}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className={styles.promoPattern} />
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className={styles.subscribeSection}>
        <div className={styles.subscribeHeader}>
          <h2 className={styles.subscribeTitle}>Join the beembai Circle</h2>
          <p className={styles.subscribeSubtitle}>
            Subscribe to our newsletter for exclusive previews of upcoming
            drops, sustainable design advice, and members-only events.
          </p>
        </div>
        <form onSubmit={handleSubscribe} className={styles.subscribeForm}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={subscribeEmail}
            onChange={(e) => setSubscribeEmail(e.target.value)}
            required
            className={styles.subscribeInput}
          />
          <button type="submit" className={styles.subscribeBtn}>
            Subscribe
          </button>
        </form>
        {subscribed && (
          <div className={styles.subscribeMessage}>
            <span style={{ color: "var(--color-success)" }}>✓</span> Thanks for
            joining! Check your inbox soon.
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandColumn}>
            <div className={styles.footerLogo}>
              beembai
              <span className={styles.logoDot} />
            </div>
            <p className={styles.footerDescription}>
              Crafting premium organic e-commerce design structures. Elevating
              spaces with warmth and purity.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialBtn} aria-label="Twitter">
                𝕏
              </a>
              <a href="#" className={styles.socialBtn} aria-label="Instagram">
                IG
              </a>
              <a href="#" className={styles.socialBtn} aria-label="GitHub">
                GH
              </a>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Shop</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#" className={styles.footerLink}>
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Electronics
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Audio & Sound
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Home & Appliances
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Company</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#" className={styles.footerLink}>
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Support</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href="#" className={styles.footerLink}>
                  Customer Portal
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className={styles.footerLink}>
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} beembai Inc. All rights reserved.</p>
          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerLink}>
              Privacy Policy
            </a>
            <a href="#" className={styles.footerLink}>
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
