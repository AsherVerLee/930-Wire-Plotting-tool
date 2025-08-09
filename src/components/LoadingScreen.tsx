import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  
  const steps = [
    "Initializing CircuitPilot...",
    "Loading component library...",
    "Setting up canvas...",
    "Ready to design!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(timer);
          setIsLoadingComplete(true); // Show continue button instead of auto-completing
          return 100;
        }
        return newProgress;
      });
    }, 30); // Smooth progress animation

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50"
      >
        <div className="text-center space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl mb-4 p-2">
              <img src="/favicon.ico" alt="930 CircuitPilot" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CircuitPilot
            </h1>
            <p className="text-xl text-gray-600 font-medium">Wire Plotting Tool</p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-80 mx-auto"
          >
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{Math.round(progress)}%</span>
              <span>Loading...</span>
            </div>
          </motion.div>

          {/* Loading Steps */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="space-y-2"
          >
            <div className="text-lg font-medium text-gray-700 h-6">
              {steps[currentStep]}
            </div>
            {!isLoadingComplete && (
              <div className="flex justify-center space-x-1">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: dot * 0.2,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Continue Button */}
          {isLoadingComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-6"
            >
              <Button
                onClick={onComplete}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Continue to CircuitPilot
              </Button>
            </motion.div>
          )}

          {/* Team Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center text-gray-500 text-sm"
          >
            <p>FRC Team 930 • Mukwonago Robotics</p>
            <p>Professional robot wiring design tool</p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
