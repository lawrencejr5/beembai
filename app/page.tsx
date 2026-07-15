"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import styles from "./page.module.css";

// SVG Components
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const StarFilledIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const StarEmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h2" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  tag?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Fujifilm X-T5 Mirrorless Camera",
    category: "Electronics",
    price: 1699,
    originalPrice: 1899,
    rating: 5,
    reviews: 124,
    image: "/images/products/fujifilm-camera.jpg",
    tag: "Best Seller",
  },
  {
    id: "2",
    title: "Shure Aonic 50 Wireless Headset",
    category: "Audio",
    price: 299,
    originalPrice: 349,
    rating: 5,
    reviews: 86,
    image: "/images/products/shure-headset.jpg",
    tag: "Premium",
  },
  {
    id: "3",
    title: "Logitech MX Master 3S Mouse",
    category: "Accessories",
    price: 99,
    rating: 4,
    reviews: 210,
    image: "/images/products/logitech-mouse.jpg",
  },
  {
    id: "4",
    title: "Apple Watch Series 9 (GPS)",
    category: "Wearables",
    price: 399,
    originalPrice: 429,
    rating: 4,
    reviews: 180,
    image: "/images/products/apple-watch.jpg",
    tag: "New",
  },
  {
    id: "5",
    title: "iPad Pro M2 with Magic Keyboard",
    category: "Electronics",
    price: 1099,
    originalPrice: 1199,
    rating: 5,
    reviews: 95,
    image: "/images/products/ipad-pro-with-keyboard.jpg",
    tag: "Trending",
  },
  {
    id: "6",
    title: "iPhone 12 Pro Max Gold Edition",
    category: "Electronics",
    price: 799,
    originalPrice: 899,
    rating: 4,
    reviews: 320,
    image: "/images/products/iphone-12-pro-max.jpg",
  },
  {
    id: "7",
    title: "AirPods Pro (2nd Generation)",
    category: "Audio",
    price: 249,
    rating: 5,
    reviews: 430,
    image: "/images/products/airpod-pro.jpg",
  },
  {
    id: "8",
    title: "D-Link Smart Wi-Fi 6 Router",
    category: "Electronics",
    price: 149,
    rating: 4,
    reviews: 64,
    image: "/images/products/d-link-router.jpg",
  },
  {
    id: "9",
    title: "Konica C35 Vintage Film Camera",
    category: "Electronics",
    price: 249,
    rating: 4,
    reviews: 48,
    image: "/images/products/konica-camera.jpg",
    tag: "Vintage",
  },
  {
    id: "10",
    title: "Techmanis Custom Mechanical Keyboard",
    category: "Accessories",
    price: 129,
    rating: 5,
    reviews: 112,
    image: "/images/products/my-techmanis-keyboard.jpg",
    tag: "Crafted",
  },
  {
    id: "11",
    title: "Retro Countertop Mini Fridge",
    category: "Appliances",
    price: 189,
    originalPrice: 219,
    rating: 4,
    reviews: 72,
    image: "/images/products/mini-fridge.jpg",
  },
  {
    id: "12",
    title: "Compact Digital Microwave Oven",
    category: "Appliances",
    price: 119,
    rating: 4,
    reviews: 55,
    image: "/images/products/microwave.jpg",
  }
];

const CATEGORIES = ["All", "Electronics", "Audio", "Accessories", "Wearables", "Appliances"];

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cartCount, setCartCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Apply theme to document element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
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
      {/* Header / Navbar */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          beembai
          <span className={styles.logoDot} />
        </div>

        <nav className={styles.navLinks}>
          <a href="#shop" className={styles.navLink}>Shop</a>
          <a href="#featured" className={styles.navLink}>Featured</a>
          <a href="#story" className={styles.navLink}>Our Story</a>
          <a href="#journal" className={styles.navLink}>Journal</a>
        </nav>

        <div className={styles.navActions}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          <button className={styles.cartIconBtn} aria-label="Shopping Cart">
            <CartIcon />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <span className={styles.heroTagLine} />
            Pure & Organic Aesthetics
          </div>
          <h1 className={styles.heroTitle}>Elegance in Every Detail.</h1>
          <p className={styles.heroDescription}>
            Explore our curated line of premium tech and home gear. Crafted to bring harmonized styling, warm organic tones, and timeless quality straight to your workspace.
          </p>
          <div className={styles.heroActions}>
            <a href="#shop" className={styles.btnPrimary}>
              Explore Collection
            </a>
            <a href="#story" className={styles.btnSecondary}>
              Our Philosophy
            </a>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroImageContainer}>
            <div className={styles.heroImageWrapper}>
              <Image
                src="/images/products/shure-headset.jpg"
                alt="Featured Shure Wireless Headset"
                fill
                priority
                className={styles.heroImg}
              />
            </div>
          </div>
          <div className={styles.heroBadge}>
            <div className={styles.heroBadgeText}>
              <span className={styles.heroBadgeVal}>$299.00</span>
              <span className={styles.heroBadgeLbl}>Featured Audio</span>
            </div>
          </div>
        </div>
      </section>

      {/* USPS Section */}
      <section className={styles.usps}>
        <div className={styles.uspItem}>
          <div className={styles.uspIconWrapper}>
            <TruckIcon />
          </div>
          <div>
            <h3 className={styles.uspTitle}>Carbon Neutral Delivery</h3>
            <p className={styles.uspDescription}>Free express shipping on all orders over $150.</p>
          </div>
        </div>
        <div className={styles.uspItem}>
          <div className={styles.uspIconWrapper}>
            <ShieldIcon />
          </div>
          <div>
            <h3 className={styles.uspTitle}>2-Year Warranty</h3>
            <p className={styles.uspDescription}>Tested against heavy standards for premium durability.</p>
          </div>
        </div>
        <div className={styles.uspItem}>
          <div className={styles.uspIconWrapper}>
            <LeafIcon />
          </div>
          <div>
            <h3 className={styles.uspTitle}>Organic Materials</h3>
            <p className={styles.uspDescription}>Biodegradable packaging and sustainable sourcing.</p>
          </div>
        </div>
        <div className={styles.uspItem}>
          <div className={styles.uspIconWrapper}>
            <CreditCardIcon />
          </div>
          <div>
            <h3 className={styles.uspTitle}>Flexible Checkout</h3>
            <p className={styles.uspDescription}>Pay in 4 interest-free installments with secure gateways.</p>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>E-store Showcase</span>
          <h2 className={styles.sectionTitle}>Curated Collections</h2>
          <p className={styles.sectionSubtitle}>
            Filter by your favorite categories or find items by name to preview the high-contrast color scheme and typography.
          </p>
        </div>

        {/* Category Filter Bar */}
        <div className={styles.filterBar}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`${styles.filterBtn} ${
                activeCategory === category ? styles.filterBtnActive : ""
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.productCard}>
              <div className={styles.productImageWrapper}>
                {product.tag && <span className={styles.cardTag}>{product.tag}</span>}
                {product.originalPrice && (
                  <span className={styles.cardDiscountTag}>
                    -{Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100
                    )}
                    %
                  </span>
                )}
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className={styles.productImg}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              <div className={styles.productDetails}>
                <span className={styles.productCategory}>{product.category}</span>
                <h3 className={styles.productTitle}>{product.title}</h3>
                
                <div className={styles.productRating}>
                  {Array.from({ length: 5 }).map((_, i) =>
                    i < product.rating ? (
                      <StarFilledIcon key={i} />
                    ) : (
                      <StarEmptyIcon key={i} />
                    )
                  )}
                  <span className={styles.ratingCount}>({product.reviews})</span>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.priceWrapper}>
                    {product.originalPrice && (
                      <span className={styles.originalPrice}>${product.originalPrice}</span>
                    )}
                    <span className={styles.price}>${product.price}</span>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className={styles.addToCartBtn}
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story / Showcase Banner */}
      <section id="story" className={styles.promoSection}>
        <div className={styles.promoContent}>
          <span className={styles.promoTag}>Premium Craftsmanship</span>
          <h2 className={styles.promoTitle}>Sustainable Workspace Essentials.</h2>
          <p className={styles.promoDescription}>
            Every beembai piece reflects a commitment to functional purity, raw structural minimalism, and sustainable sourcing. We work closely with designers to make spaces beautiful, warm, and highly productive.
          </p>
          <button className={styles.promoBtn}>Read Our Journey</button>
        </div>
        <div className={styles.promoVisual}>
          <div className={styles.promoImageWrapper}>
            <Image
              src="/images/products/my-techmanis-keyboard.jpg"
              alt="Custom Solid Wood Mechanical Keyboard"
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
            Subscribe to our newsletter for exclusive previews of upcoming drops, sustainable design advice, and members-only events.
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
            <span style={{ color: "var(--color-success)" }}>✓</span> Thanks for joining! Check your inbox soon.
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
              Crafting premium organic e-commerce design structures. Elevating spaces with warmth and purity.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialBtn} aria-label="Twitter">𝕏</a>
              <a href="#" className={styles.socialBtn} aria-label="Instagram">IG</a>
              <a href="#" className={styles.socialBtn} aria-label="GitHub">GH</a>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Shop</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>New Arrivals</a></li>
              <li><a href="#" className={styles.footerLink}>Electronics</a></li>
              <li><a href="#" className={styles.footerLink}>Audio & Sound</a></li>
              <li><a href="#" className={styles.footerLink}>Home & Appliances</a></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Company</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>About Us</a></li>
              <li><a href="#" className={styles.footerLink}>Sustainability</a></li>
              <li><a href="#" className={styles.footerLink}>Careers</a></li>
              <li><a href="#" className={styles.footerLink}>Press Kit</a></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4 className={styles.footerColTitle}>Support</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>Customer Portal</a></li>
              <li><a href="#" className={styles.footerLink}>Shipping & Returns</a></li>
              <li><a href="#" className={styles.footerLink}>Track Order</a></li>
              <li><a href="#" className={styles.footerLink}>Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} beembai Inc. All rights reserved.</p>
          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLink}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
