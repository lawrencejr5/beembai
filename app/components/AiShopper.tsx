"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./AiShopper.module.css";
import { PRODUCTS_DATA, Product, formatPrice } from "@/app/data/data";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  products?: Product[];
  timestamp: Date;
}

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

const SUGGESTIONS = [
  "Show me some premium mechanical keyboards",
  "What are some best-selling items?",
  "Looking for organic groceries",
  "Recommend design essentials for a home office",
];

const getAiResponse = (
  userInput: string,
): { text: string; products?: Product[] } => {
  const query = userInput.toLowerCase();

  if (query.includes("keyboard") || query.includes("keychron")) {
    const keyboards = PRODUCTS_DATA.filter(
      (p) =>
        p.title.toLowerCase().includes("keyboard") ||
        p.categorySlug === "gadgets-accessories",
    ).slice(0, 3);
    return {
      text: "I found some premium mechanical keyboards and setup gear. Here are the top selections directly from our verified creators:",
      products: keyboards,
    };
  }

  if (
    query.includes("grocer") ||
    query.includes("organic") ||
    query.includes("staple") ||
    query.includes("milo")
  ) {
    const groceries = PRODUCTS_DATA.filter(
      (p) => p.categorySlug === "groceries",
    ).slice(0, 3);
    return {
      text: "Here are farm-fresh organic groceries and pantry staples sourced directly from our local storefronts:",
      products: groceries,
    };
  }

  if (
    query.includes("best") ||
    query.includes("popular") ||
    query.includes("feature")
  ) {
    const featured = PRODUCTS_DATA.filter((p) => p.isFeatured).slice(0, 3);
    return {
      text: "Check out the absolute best-selling, top-rated products that our community is loving right now:",
      products: featured,
    };
  }

  if (
    query.includes("office") ||
    query.includes("furniture") ||
    query.includes("desk") ||
    query.includes("chair")
  ) {
    const furniture = PRODUCTS_DATA.filter(
      (p) =>
        p.categorySlug === "furniture" ||
        p.title.toLowerCase().includes("desk") ||
        p.title.toLowerCase().includes("chair"),
    ).slice(0, 3);
    return {
      text: "Here are premium Scandinavian furniture pieces and accent items, perfect for a balanced home office setup:",
      products: furniture,
    };
  }

  if (
    query.includes("fashion") ||
    query.includes("apparel") ||
    query.includes("hoodie") ||
    query.includes("shirt")
  ) {
    const fashion = PRODUCTS_DATA.filter(
      (p) => p.categorySlug === "fashion",
    ).slice(0, 3);
    return {
      text: "Here are trending apparel choices and luxury streetwear styles to level up your style:",
      products: fashion,
    };
  }

  return {
    text: "That sounds like a wonderful choice! I can help you locate products, explore brand storefronts, or search categories. Try asking me for 'mechanical keyboards', 'best sellers', or 'office desks' to see specific recommendations.",
  };
};

export default function AiShopper() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-msg",
      sender: "ai",
      text: "Hello! I'm your Beembai AI Personal Shopper. Sourcing from our verified brand partners, I can help you find products, explore curated stores, or suggest setups. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation feed
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Handle closing drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      const response = getAiResponse(trimmed);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.text,
        products: response.products,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${styles.floatingBtn} ${isOpen ? styles.floatingBtnActive : ""}`}
        aria-label="Open AI Shopper"
      >
        {isOpen ? <CloseIcon /> : <SparklesIcon />}
      </button>

      {/* Side Backdrop Overlay */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropActive : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Shopper Container */}
      <div
        className={`${styles.shopperContainer} ${isOpen ? styles.shopperContainerActive : ""}`}
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitleWrapper}>
            <h2 className={styles.headerTitle}>
              <SparklesIcon />
              <span>Beembai Shopper</span>
            </h2>
            <span className={styles.headerSubtitle}>
              Curating setups & brand products
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className={styles.closeBtn}
            aria-label="Close shopper"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Conversation Message Feed */}
        <div className={styles.messageFeed}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${
                msg.sender === "user" ? styles.userMsgRow : styles.aiMsgRow
              }`}
            >
              {msg.sender === "ai" && (
                <div className={styles.aiAvatar}>
                  <SparklesIcon />
                </div>
              )}
              <div
                className={`${styles.bubble} ${
                  msg.sender === "user" ? styles.userBubble : styles.aiBubble
                }`}
              >
                <div>{msg.text}</div>
                {msg.products && msg.products.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {msg.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => setIsOpen(false)}
                        className={styles.productLinkCard}
                      >
                        <div className={styles.productLinkImg}>
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="48px"
                          />
                        </div>
                        <div className={styles.productLinkInfo}>
                          <span className={styles.productLinkTitle}>
                            {product.title}
                          </span>
                          <span className={styles.productLinkPrice}>
                            ₦{formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className={`${styles.msgRow} ${styles.aiMsgRow}`}>
              <div className={styles.aiAvatar}>
                <SparklesIcon />
              </div>
              <div className={`${styles.bubble} ${styles.aiBubble}`}>
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className={styles.suggestionsContainer}>
          <div className={styles.suggestionsTitle}>Suggestions to Try</div>
          <div className={styles.suggestionsWrapper}>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={styles.suggestionChip}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleFormSubmit} className={styles.inputForm}>
          <div
            className={`${styles.inputWrapper} ${
              isInputFocused ? styles.inputWrapperFocused : ""
            }`}
          >
            <input
              type="text"
              placeholder="Ask about mechanical keyboards, setups..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className={styles.inputField}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`${styles.sendBtn} ${
              !inputValue.trim() || isTyping ? styles.sendBtnDisabled : ""
            }`}
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </>
  );
}
