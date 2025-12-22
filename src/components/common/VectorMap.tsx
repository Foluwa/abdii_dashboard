"use client";

import React, { useEffect } from "react";

export default function VectorMap() {
  useEffect(() => {
    // Dynamically load jvectormap
    const loadMap = async () => {
      if (typeof window !== "undefined") {
        try {
          const { VectorMap } = await import("@react-jvectormap/core");
          const { worldMill } = await import("@react-jvectormap/world");
          
          // Map configuration would go here
        } catch (error) {
          console.error("Error loading map:", error);
        }
      }
    };
    
    loadMap();
  }, []);

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden">
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-center">
          <div className="mb-3">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            World Map
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Geographic user distribution visualization
          </p>
        </div>
      </div>
    </div>
  );
}
