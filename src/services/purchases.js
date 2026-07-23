// In-app purchase backbone for the one-time "Remove Ads" upgrade.
//
// Real store integration (StoreKit via expo-in-app-purchases / react-native-iap,
// or RevenueCat) can only run in a native build, not in Expo Go — and requires
// products configured in App Store Connect. So this module defines the full
// app-facing surface (entitlement state, purchase, restore) with the store call
// isolated behind `runStorePurchase` / `runStoreRestore`. Swap those two
// functions for the real SDK when you wire it up in Xcode; nothing else in the
// app has to change.
//
// The entitlement is cached locally (AsyncStorage) so it survives restarts. In
// production the store receipt / RevenueCat remains the source of truth and
// should be re-validated on launch via restorePurchases().

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The App Store product to create in App Store Connect (non-consumable).
export const REMOVE_ADS_PRODUCT_ID = 'com.solodev.connectfour.removeads';
export const REMOVE_ADS_PRICE = '$1.99';

const STORAGE_KEY = '@connect4/adFree';

// While there is no real store SDK, simulate a successful purchase so the flow
// is testable end-to-end. Set to false once real StoreKit calls are wired in.
const SIMULATE_PURCHASES = true;

// Exposed so the UI can show a debug "reset" affordance while simulating (there
// is no way to "un-buy" a real non-consumable, so this is dev-only).
export const PURCHASES_SIMULATED = SIMULATE_PURCHASES;

// ---- Store seam (replace with real SDK calls in the native build) ----
async function runStorePurchase() {
  if (SIMULATE_PURCHASES) {
    await new Promise((r) => setTimeout(r, 600)); // mimic store round-trip
    return { success: true };
  }
  // TODO(native build): e.g. with react-native-iap
  //   const purchase = await requestPurchase(REMOVE_ADS_PRODUCT_ID);
  //   await finishTransaction({ purchase });
  //   return { success: true };
  return { success: false, error: 'Store not available' };
}

async function runStoreRestore() {
  if (SIMULATE_PURCHASES) {
    await new Promise((r) => setTimeout(r, 400));
    // Nothing new to restore in the simulation beyond the local cache.
    return { restored: false };
  }
  // TODO(native build): query past purchases and look for REMOVE_ADS_PRODUCT_ID.
  return { restored: false };
}
// ----------------------------------------------------------------------

const PurchaseContext = createContext(null);

export function PurchaseProvider({ children }) {
  const [isAdFree, setIsAdFree] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'true') setIsAdFree(true);
      } catch (e) {
        /* default: ads on */
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  async function persistAdFree(value) {
    setIsAdFree(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch (e) {
      /* non-fatal */
    }
  }

  // Buy the Remove Ads upgrade. Returns { success, error? }.
  async function purchaseRemoveAds() {
    if (isAdFree || purchasing) return { success: true };
    setPurchasing(true);
    try {
      const res = await runStorePurchase();
      if (res.success) await persistAdFree(true);
      return res;
    } catch (e) {
      return { success: false, error: e?.message || 'Purchase failed' };
    } finally {
      setPurchasing(false);
    }
  }

  // Restore a previously bought upgrade (App Store requires a Restore button).
  async function restorePurchases() {
    setPurchasing(true);
    try {
      const res = await runStoreRestore();
      if (res.restored) await persistAdFree(true);
      // Return the effective entitlement so the UI can message correctly.
      return { restored: res.restored || isAdFree };
    } catch (e) {
      return { restored: false, error: e?.message || 'Restore failed' };
    } finally {
      setPurchasing(false);
    }
  }

  // Dev-only: clear the simulated entitlement so ads come back (there is no
  // "un-buy" for a real purchase; this is gated on SIMULATE_PURCHASES in the UI).
  async function resetPurchase() {
    await persistAdFree(false);
  }

  const value = useMemo(
    () => ({ isAdFree, purchasing, hydrated, purchaseRemoveAds, restorePurchases, resetPurchase }),
    [isAdFree, purchasing, hydrated],
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchases() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchases must be used within a PurchaseProvider');
  return ctx;
}
