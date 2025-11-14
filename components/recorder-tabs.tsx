"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Monitor, Camera, MonitorPlay } from "lucide-react";

const ScreenRecorder = dynamic(() => import("./screen-recorder").then(mod => ({ default: mod.ScreenRecorder })), { ssr: false });
const WebcamRecorder = dynamic(() => import("./webcam-recorder").then(mod => ({ default: mod.WebcamRecorder })), { ssr: false });
const CombinedRecorder = dynamic(() => import("./combined-recorder").then(mod => ({ default: mod.CombinedRecorder })), { ssr: false });

interface RecorderTabsProps {
  onVideoUploaded: () => void;
}

export function RecorderTabs({ onVideoUploaded }: RecorderTabsProps) {
  const [activeTab, setActiveTab] = useState<"screen" | "webcam" | "combined">("screen");

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      <div className="flex gap-2 mb-6 border-b pb-4">
        <button
          onClick={() => setActiveTab("screen")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "screen"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Monitor className="w-5 h-5" />
          Screen Only
        </button>
        <button
          onClick={() => setActiveTab("webcam")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "webcam"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Camera className="w-5 h-5" />
          Webcam Only
        </button>
        <button
          onClick={() => setActiveTab("combined")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "combined"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <MonitorPlay className="w-5 h-5" />
          Screen + Webcam
        </button>
      </div>

      {activeTab === "screen" && <ScreenRecorder onVideoUploaded={onVideoUploaded} />}
      {activeTab === "webcam" && <WebcamRecorder onVideoUploaded={onVideoUploaded} />}
      {activeTab === "combined" && <CombinedRecorder onVideoUploaded={onVideoUploaded} />}
    </div>
  );
}
