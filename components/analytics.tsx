"use client";

import { useEffect, useState } from "react";
import { Eye, Clock, Video, Monitor, Camera, MonitorPlay } from "lucide-react";

interface AnalyticsData {
  totalVideos: number;
  totalViews: number;
  totalDuration: number;
  byType: {
    screen: number;
    webcam: number;
    combined: number;
  };
  byQuality: {
    high: number;
    medium: number;
    low: number;
    standard: number;
  };
  recentActivity: Array<{
    type: string;
    count: number;
    date: string;
  }>;
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-600">No analytics data available</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Video className="w-8 h-8" />
            <span className="text-sm opacity-90">Total</span>
          </div>
          <div className="text-3xl font-bold">{analytics.totalVideos}</div>
          <div className="text-sm opacity-90">Recordings</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-8 h-8" />
            <span className="text-sm opacity-90">Total</span>
          </div>
          <div className="text-3xl font-bold">{analytics.totalViews}</div>
          <div className="text-sm opacity-90">Views</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8" />
            <span className="text-sm opacity-90">Total</span>
          </div>
          <div className="text-3xl font-bold">{formatDuration(analytics.totalDuration)}</div>
          <div className="text-sm opacity-90">Recording Time</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">By Recording Type</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span>Screen Only</span>
              </div>
              <span className="font-bold">{analytics.byType.screen}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                <span>Webcam Only</span>
              </div>
              <span className="font-bold">{analytics.byType.webcam}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-green-600" />
                <span>Combined</span>
              </div>
              <span className="font-bold">{analytics.byType.combined}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">By Quality</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>High Quality</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.byQuality.high /
                          Math.max(
                            analytics.byQuality.high +
                              analytics.byQuality.medium +
                              analytics.byQuality.low +
                              analytics.byQuality.standard,
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="font-bold w-8">{analytics.byQuality.high}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Medium Quality</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.byQuality.medium /
                          Math.max(
                            analytics.byQuality.high +
                              analytics.byQuality.medium +
                              analytics.byQuality.low +
                              analytics.byQuality.standard,
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="font-bold w-8">{analytics.byQuality.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Low Quality</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.byQuality.low /
                          Math.max(
                            analytics.byQuality.high +
                              analytics.byQuality.medium +
                              analytics.byQuality.low +
                              analytics.byQuality.standard,
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="font-bold w-8">{analytics.byQuality.low}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Standard</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (analytics.byQuality.standard /
                          Math.max(
                            analytics.byQuality.high +
                              analytics.byQuality.medium +
                              analytics.byQuality.low +
                              analytics.byQuality.standard,
                            1
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="font-bold w-8">{analytics.byQuality.standard}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
