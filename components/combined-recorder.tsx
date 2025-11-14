"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Circle, Square, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CombinedRecorderProps {
  onVideoUploaded: () => void;
}

export function CombinedRecorder({ onVideoUploaded }: CombinedRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState("high");
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: quality === "high" ? 1920 : quality === "medium" ? 1280 : 640,
          height: quality === "high" ? 1080 : quality === "medium" ? 720 : 480,
        },
        audio: true,
      });

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });

      const canvas = canvasRef.current;
      const preview = previewRef.current;
      const webcam = webcamRef.current;

      if (!canvas || !preview || !webcam) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = quality === "high" ? 1920 : quality === "medium" ? 1280 : 640;
      canvas.height = quality === "high" ? 1080 : quality === "medium" ? 720 : 480;

      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.play();

      webcam.srcObject = webcamStream;
      webcam.play();

      const drawFrame = () => {
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        
        const pipWidth = canvas.width * 0.2;
        const pipHeight = canvas.height * 0.2;
        const pipX = canvas.width - pipWidth - 20;
        const pipY = canvas.height - pipHeight - 20;

        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.strokeRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);

        ctx.drawImage(webcam, pipX, pipY, pipWidth, pipHeight);

        animationRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();

      const canvasStream = canvas.captureStream(30);
      const audioTracks = screenStream.getAudioTracks();
      audioTracks.forEach((track) => canvasStream.addTrack(track));

      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(canvasStream, options);
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
        screenStream.getTracks().forEach((track) => track.stop());
        webcamStream.getTracks().forEach((track) => track.stop());
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
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
        description: "Your screen and webcam are being recorded",
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
      a.download = `combined-recording-${Date.now()}.webm`;
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
          type: "combined",
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

      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />
        <video ref={previewRef} className="hidden" />
        <video ref={webcamRef} className="hidden" />
        
        {recordedBlob ? (
          <video ref={videoRef} controls className="w-full h-full rounded-lg" />
        ) : (
          <div className="text-center text-gray-400">
            <p>Screen + Webcam preview will appear here</p>
            <p className="text-sm mt-2">Webcam will appear in picture-in-picture mode</p>
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
