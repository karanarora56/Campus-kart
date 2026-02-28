import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl pointer-events-auto dark:border-white/10 dark:bg-[#12161f]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 text-electric-violet">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-violet/10">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Login Required</h3>
                </div>
                <button onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <p className="mb-8 mt-2 text-sm leading-relaxed text-slate-500 dark:text-gray-400">
                You need to be logged in to interact with listings. Join Campus Kart to contact sellers, make requests, and secure safe meetups.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="w-full rounded-xl bg-electric-violet py-3.5 text-center font-bold text-white transition-all duration-300 hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                >
                  Login / Sign Up
                </Link>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl py-3.5 text-center font-semibold text-slate-500 transition-all duration-300 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};