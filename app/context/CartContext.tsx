"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Product, getProductById } from "@/app/data/data";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface CartItem {
  product: Product;
  selectedColor?: string;
  quantity: number;
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedColor?: string,
  ) => void;
  removeFromCart: (productId: string, selectedColor?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedColor?: string,
  ) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalPrice: number;
  cartBounce: boolean;
  selectedItemKeys: Record<string, boolean>;
  toggleSelectItem: (productId: string, selectedColor?: string) => void;
  setSelectedAll: (selected: boolean) => void;
  clearSelectedCart: () => void;
  selectedCart: CartItem[];
  selectedSubtotalPrice: number;
  selectedItemsCount: number;
}

const CART_STORAGE_KEY = "beembai_cart_items_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Convex Auth and Cart integrations
  const user = useQuery(api.users.viewer);
  const dbCartItems = useQuery(api.cart.getCart);

  const addDbCart = useMutation(api.cart.addToCart);
  const removeDbCart = useMutation(api.cart.removeFromCart);
  const updateDbQty = useMutation(api.cart.updateQuantity);
  const clearDbCart = useMutation(api.cart.clearCart);
  const mergeDbCart = useMutation(api.cart.mergeCart);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Selection states
  const [selectedItemKeys, setSelectedItemKeys] = useState<Record<string, boolean>>({});

  const triggerBounce = () => {
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 650);
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever guest cart state changes
  useEffect(() => {
    if (!isLoaded || user) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart, isLoaded, user]);

  // Merge guest cart items into database and clear local storage when user logs in
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const itemsToMerge = parsed.map((item: CartItem) => ({
              productId: item.product.id,
              selectedColor: item.selectedColor,
              quantity: item.quantity,
            }));
            void mergeDbCart({ items: itemsToMerge }).then(() => {
              localStorage.removeItem(CART_STORAGE_KEY);
              setCart([]);
            });
          } else {
            localStorage.removeItem(CART_STORAGE_KEY);
            setCart([]);
          }
        } catch (error) {
          console.error("Failed to merge localStorage cart items", error);
          localStorage.removeItem(CART_STORAGE_KEY);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }
  }, [user, mergeDbCart]);

  // Map database cart items to frontend CartItem structures
  const mappedDbCart = useMemo(() => {
    if (!user || !dbCartItems) return [];
    return dbCartItems
      .map((item): CartItem | null => {
        const product = getProductById(item.productId);
        if (!product) return null;
        return {
          product,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [dbCartItems, user]);

  // Determine active cart source
  const activeCart = useMemo(() => {
    if (user) {
      return mappedDbCart;
    }
    return cart;
  }, [user, mappedDbCart, cart]);

  // Synchronize selection state with active cart items
  useEffect(() => {
    setSelectedItemKeys((prevKeys) => {
      const nextKeys = { ...prevKeys };
      let updated = false;

      // Keep track of active item keys
      const activeKeys = new Set(
        activeCart.map((item) => `${item.product.id}-${item.selectedColor || "default"}`)
      );

      // 1. Initialize newly added items as selected (true)
      for (const item of activeCart) {
        const key = `${item.product.id}-${item.selectedColor || "default"}`;
        if (nextKeys[key] === undefined) {
          nextKeys[key] = true;
          updated = true;
        }
      }

      // 2. Remove keys of items no longer in the cart
      for (const key of Object.keys(nextKeys)) {
        if (!activeKeys.has(key)) {
          delete nextKeys[key];
          updated = true;
        }
      }

      return updated ? nextKeys : prevKeys;
    });
  }, [activeCart]);

  const toggleSelectItem = (productId: string, selectedColor?: string) => {
    const key = `${productId}-${selectedColor || "default"}`;
    setSelectedItemKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setSelectedAll = (selected: boolean) => {
    setSelectedItemKeys((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = selected;
      }
      return next;
    });
  };

  const clearSelectedCart = () => {
    // Collect all selected items
    const selectedItems = activeCart.filter((item) => {
      const key = `${item.product.id}-${item.selectedColor || "default"}`;
      return selectedItemKeys[key] === true;
    });

    if (user) {
      // Clear selected items from database
      selectedItems.forEach((item) => {
        void removeDbCart({ productId: item.product.id, selectedColor: item.selectedColor });
      });
    } else {
      // Clear selected items from localStorage state
      setCart((prevCart) =>
        prevCart.filter((item) => {
          const key = `${item.product.id}-${item.selectedColor || "default"}`;
          return selectedItemKeys[key] !== true;
        })
      );
    }
  };

  const selectedCart = useMemo(() => {
    return activeCart.filter((item) => {
      const key = `${item.product.id}-${item.selectedColor || "default"}`;
      return selectedItemKeys[key] === true;
    });
  }, [activeCart, selectedItemKeys]);

  const selectedSubtotalPrice = useMemo(() => {
    return selectedCart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  }, [selectedCart]);

  const selectedItemsCount = useMemo(() => {
    return selectedCart.reduce((total, item) => total + item.quantity, 0);
  }, [selectedCart]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
  ) => {
    const colorToUse =
      selectedColor ||
      (product.colors && product.colors.length > 0
        ? product.colors[0]
        : undefined);
    const maxStock = product.stock ?? 15;

    triggerBounce();

    if (user) {
      void addDbCart({
        productId: product.id,
        selectedColor: colorToUse,
        quantity,
      });
    } else {
      setCart((prevCart) => {
        const existingIndex = prevCart.findIndex(
          (item) =>
            item.product.id === product.id && item.selectedColor === colorToUse,
        );

        if (existingIndex > -1) {
          const updated = [...prevCart];
          const newQty = Math.min(
            maxStock,
            updated[existingIndex].quantity + quantity,
          );
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
          };
          return updated;
        }

        const initialQty = Math.min(maxStock, Math.max(1, quantity));
        return [
          ...prevCart,
          { product, selectedColor: colorToUse, quantity: initialQty },
        ];
      });
    }
  };

  const removeFromCart = (productId: string, selectedColor?: string) => {
    if (user) {
      void removeDbCart({ productId, selectedColor });
    } else {
      setCart((prevCart) =>
        prevCart.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.selectedColor === selectedColor
            ),
        ),
      );
    }
  };

  const updateQuantity = (
    productId: string,
    newQuantity: number,
    selectedColor?: string,
  ) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, selectedColor);
      return;
    }

    if (user) {
      void updateDbQty({ productId, selectedColor, quantity: newQuantity });
    } else {
      setCart((prevCart) => {
        const targetItem = prevCart.find(
          (item) =>
            item.product.id === productId &&
            item.selectedColor === selectedColor,
        );
        if (targetItem && newQuantity > targetItem.quantity) {
          triggerBounce();
        }

        return prevCart.map((item) => {
          if (
            item.product.id === productId &&
            item.selectedColor === selectedColor
          ) {
            const maxStock = item.product.stock ?? 15;
            return { ...item, quantity: Math.min(maxStock, newQuantity) };
          }
          return item;
        });
      });
    }
  };

  const clearCart = () => {
    if (user) {
      void clearDbCart();
    } else {
      setCart([]);
    }
  };

  const totalItemsCount = useMemo(() => {
    return activeCart.reduce((total, item) => total + item.quantity, 0);
  }, [activeCart]);

  const subtotalPrice = useMemo(() => {
    return activeCart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  }, [activeCart]);

  return (
    <CartContext.Provider
      value={{
        cart: activeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotalPrice,
        cartBounce,
        selectedItemKeys,
        toggleSelectItem,
        setSelectedAll,
        clearSelectedCart,
        selectedCart,
        selectedSubtotalPrice,
        selectedItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
