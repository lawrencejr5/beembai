"use client";

import React, { createContext, useContext } from "react";

export interface Store {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status?: string;
  verificationStatus?: string;
  rejectionReason?: string;
  rating: number;
  logo?: string;
  banner?: string;
  physicalAddress?: string;
  city?: string;
  stateName?: string;
  country?: string;
  email?: string;
  phone?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
}

export interface SellerStoreContextType {
  activeStoreId: string | null; // null represents "All Stores"
  setActiveStoreId: (id: string | null) => void;
  stores: Store[];
  loading: boolean;
}

export const SellerStoreContext = createContext<SellerStoreContextType>({
  activeStoreId: null,
  setActiveStoreId: () => {},
  stores: [],
  loading: true,
});

export const useSellerStore = () => useContext(SellerStoreContext);
