"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Circle, Square, Download, Upload, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScreenRecorderProps {
  onVideoUploaded: () => void;
}

export function ScreenRecorder({ onVideoUploaded }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState("high");
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: quality === "high" ? 1920 : quality === "medium" ? 1280 : 640,
          height: quality === "high" ? 1080 : quality === "medium" ? 720 : 480,
        },
        audio: true,
      });

      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(blob);
        }
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Your screen is being recorded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording. Please grant permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Your recording is ready",
      });
    }
  };

  const downloadVideo = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screen-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    try {
      const response = await fetch("/api/videos/upload", {
        method: "POST",
      });
      const { uploadURL } = await response.json();

      await fetch(uploadURL, {
        method: "PUT",
        body: recordedBlob,
        headers: {
          "Content-Type": "video/webm",
        },
      });

      const saveResponse = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoURL: uploadURL.split("?")[0],
          duration: recordingTime,
          type: "screen",
          quality,
        }),
      });

      if (saveResponse.ok) {
        toast({
          title: "Upload successful",
          description: "Your video has been saved",
        });
        setRecordedBlob(null);
        setRecordingTime(0);
        onVideoUploaded();
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Recording Quality</label>
          <Select value={quality} onValueChange={setQuality} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High (1920x1080)</SelectItem>
              <SelectItem value="medium">Medium (1280x720)</SelectItem>
              <SelectItem value="low">Low (640x480)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isRecording && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">Recording Time</div>
            <div className="text-2xl font-bold text-red-600">{formatTime(recordingTime)}</div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
        {recordedBlob ? (
          <video ref={videoRef} controls className="w-full h-full rounded-lg" />
        ) : (
          <div className="text-center text-gray-400">
            <Monitor className="w-16 h-16 mx-auto mb-2" />
            <p>Your recording preview will appear here</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isRecording ? (
          <Button onClick={startRecording} className="flex-1" size="lg" disabled={uploading}>
            <Circle className="w-5 h-5 mr-2 fill-current" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
            <Square className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}

        {recordedBlob && !isRecording && (
          <>
            <Button onClick={downloadVideo} variant="outline" size="lg" disabled={uploading}>
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
            <Button onClick={uploadVideo} size="lg" disabled={uploading}>
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
