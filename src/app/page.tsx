'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import WelcomeModal from '@/components/WelcomeModal';
import ChatInterface from '@/components/ChatInterface';

function subscribeToHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useChatStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useChatStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}

export default function Home() {
  const hasAgreed = useChatStore((state) => state.hasAgreed);
  const initUser = useChatStore((state) => state.initUser);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => useChatStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    void useChatStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (isHydrated) {
      initUser();
    }
  }, [initUser, isHydrated]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isHydrated) {
    return <div className="h-screen w-screen bg-stone-50" />;
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-stone-50">
      <AnimatePresence mode="wait">
        {!hasAgreed ? (
          <motion.div
            key="modal-container"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-50"
          >
            <WelcomeModal />
          </motion.div>
        ) : (
          <motion.div
            key="chat-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full"
          >
            <ChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
