"use client";

import dynamic from "next/dynamic";
import { Video, BarChart3 } from "lucide-react";
import { useState } from "react";

const RecorderTabs = dynamic(() => import("@/components/recorder-tabs").then(mod => ({ default: mod.RecorderTabs })), { ssr: false });
const VideoGallery = dynamic(() => import("@/components/video-gallery").then(mod => ({ default: mod.VideoGallery })), { ssr: false });
const Analytics = dynamic(() => import("@/components/analytics").then(mod => ({ default: mod.Analytics })), { ssr: false });

export default function Home() {
  const [activeView, setActiveView] = useState<"recorder" | "gallery" | "analytics">("recorder");
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleVideoUploaded = () => {
    setRefreshGallery(prev => prev + 1);
    setActiveView("gallery");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Screen Recorder Pro
          </h1>
          <p className="text-gray-600">Record your screen, webcam, or both with ease</p>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveView("recorder")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeView === "recorder"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Video className="w-5 h-5" />
            Recorder
          </button>
          <button
            onClick={() => setActiveView("gallery")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeView === "gallery"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Video className="w-5 h-5" />
            Gallery
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeView === "analytics"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          {activeView === "recorder" && <RecorderTabs onVideoUploaded={handleVideoUploaded} />}
          {activeView === "gallery" && <VideoGallery key={refreshGallery} />}
          {activeView === "analytics" && <Analytics />}
        </div>
      </div>
    </main>
  );
}
