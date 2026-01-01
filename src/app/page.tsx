'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import WelcomeModal from '@/components/WelcomeModal';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const { hasAgreed, initUser } = useChatStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    useChatStore.persist.rehydrate();
    initUser();
    setIsMounted(true);
  }, [initUser]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!isMounted) {
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