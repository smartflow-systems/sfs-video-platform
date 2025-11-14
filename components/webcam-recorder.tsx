"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Circle, Square, Download, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebcamRecorderProps {
  onVideoUploaded: () => void;
}

export function WebcamRecorder({ onVideoUploaded }: WebcamRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCameras();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const loadCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading cameras:", error);
    }
  };

  const startPreview = async () => {
    if (!selectedCamera) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera },
        audio: true,
      });
      
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error starting preview:", error);
    }
  };

  useEffect(() => {
    if (selectedCamera && !isRecording && !recordedBlob) {
      startPreview();
    }
  }, [selectedCamera]);

  const startRecording = async () => {
    if (!streamRef.current) {
      await startPreview();
    }

    if (streamRef.current) {
      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
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
        description: "Your webcam is being recorded",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
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
      a.download = `webcam-recording-${Date.now()}.webm`;
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
          type: "webcam",
          quality: "standard",
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
        startPreview();
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
          <label className="block text-sm font-medium mb-2">Select Camera</label>
          <Select value={selectedCamera} onValueChange={setSelectedCamera} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a camera" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((camera) => (
                <SelectItem key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
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

      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
        {recordedBlob ? (
          <video ref={videoRef} controls className="w-full h-full rounded-lg" />
        ) : (
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full rounded-lg object-cover"
          />
        )}
      </div>

      <div className="flex gap-3">
        {!isRecording ? (
          <Button onClick={startRecording} className="flex-1" size="lg" disabled={uploading || !selectedCamera}>
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
