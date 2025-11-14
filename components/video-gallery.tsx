"use client";

import { useEffect, useState } from "react";
import { Play, Trash2, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  videoPath: string;
  duration: number;
  type: string;
  quality: string;
  views: number;
  createdAt: string;
}

export function VideoGallery() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (video: Video) => {
    setSelectedVideo(video);
    
    await fetch(`/api/videos/${video.id}/view`, {
      method: "POST",
    });
    
    loadVideos();
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Video deleted",
          description: "The video has been removed",
        });
        loadVideos();
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading videos...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">Your Recordings</h2>

      {videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No recordings yet. Start recording to see your videos here!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedVideo && (
            <div className="bg-gray-900 rounded-lg aspect-video overflow-hidden mb-6">
              <video
                src={selectedVideo.videoPath}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="bg-gray-900 aspect-video flex items-center justify-center relative group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={() => handlePlay(video)}
                      size="lg"
                      className="rounded-full w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="w-8 h-8" />
                    </Button>
                  </div>
                  <div className="text-white text-sm bg-black bg-opacity-60 px-2 py-1 rounded absolute bottom-2 right-2">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {video.type} Recording
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {video.quality}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.views} views
                    </span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>

                  <Button
                    onClick={() => handleDelete(video.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
