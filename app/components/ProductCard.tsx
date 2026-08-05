"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";
import { Product, formatPrice } from "@/app/data/data";
import { useCart } from "@/app/context/CartContext";

const CartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
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

export interface ProductCardProps {
  product: Product;
  cardStyle?: React.CSSProperties;
  imageSizes?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cardStyle,
  imageSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}) => {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItems = cart.filter((item) => item.product.id === product.id);
  const totalQtyInCart = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const maxStock = product.stock ?? 15;

  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItems.length > 0) {
      const targetItem = cartItems[0];
      updateQuantity(
        product.id,
        targetItem.quantity - 1,
        targetItem.selectedColor,
      );
    }
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalQtyInCart >= maxStock) return;

    if (cartItems.length > 0) {
      const targetItem = cartItems[0];
      updateQuantity(
        product.id,
        targetItem.quantity + 1,
        targetItem.selectedColor,
      );
    } else {
      addToCart(product, 1);
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className={styles.productCard}
      style={cardStyle}
    >
      <div className={styles.productImageWrapper}>
        {product.tag && <span className={styles.cardTag}>{product.tag}</span>}
        {discountPercent > 0 && (
          <span className={styles.cardDiscountTag}>-{discountPercent}%</span>
        )}
        <Image
          src={product.image}
          alt={product.title}
          fill
          className={styles.productImg}
          sizes={imageSizes}
        />
      </div>

      <div className={styles.productDetails}>
        <span className={styles.productCategory}>{product.categoryName}</span>
        <h3 className={styles.productTitle}>{product.title}</h3>

        <div className={styles.cardFooter}>
          <div className={styles.priceWrapper}>
            {product.originalPrice && (
              <span className={styles.originalPrice}>
                ${formatPrice(product.originalPrice)}
              </span>
            )}
            <span className={styles.price}>${formatPrice(product.price)}</span>
          </div>

          {totalQtyInCart === 0 ? (
            /* Round Cart Icon Button when item is NOT in cart */
            <button
              type="button"
              onClick={handleAddToCart}
              className={styles.addToCartBtn}
              aria-label={`Add ${product.title} to cart`}
            >
              <CartIcon />
            </button>
          ) : (
            /* Dynamic Inline Counter Pill (- 1 +) when item IS in cart */
            <div
              className={styles.cardCounterPill}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={handleDecrease}
                className={styles.cardQtyBtn}
                aria-label={`Decrease ${product.title} quantity`}
              >
                -
              </button>
              <span className={styles.cardQtyValue}>{totalQtyInCart}</span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={totalQtyInCart >= maxStock}
                className={styles.cardQtyBtn}
                aria-label={`Increase ${product.title} quantity`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
