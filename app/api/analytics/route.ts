import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");

async function readVideos() {
  try {
    const data = await fs.readFile(VIDEOS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { videos: [] };
  }
}

export async function GET() {
  try {
    const data = await readVideos();
    const videos = data.videos || [];

    const analytics = {
      totalVideos: videos.length,
      totalViews: videos.reduce((sum: number, v: any) => sum + (v.views || 0), 0),
      totalDuration: videos.reduce((sum: number, v: any) => sum + (v.duration || 0), 0),
      byType: {
        screen: videos.filter((v: any) => v.type === "screen").length,
        webcam: videos.filter((v: any) => v.type === "webcam").length,
        combined: videos.filter((v: any) => v.type === "combined").length,
      },
      byQuality: {
        high: videos.filter((v: any) => v.quality === "high").length,
        medium: videos.filter((v: any) => v.quality === "medium").length,
        low: videos.filter((v: any) => v.quality === "low").length,
        standard: videos.filter((v: any) => v.quality === "standard").length,
      },
      recentActivity: [],
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      {
        totalVideos: 0,
        totalViews: 0,
        totalDuration: 0,
        byType: { screen: 0, webcam: 0, combined: 0 },
        byQuality: { high: 0, medium: 0, low: 0, standard: 0 },
        recentActivity: [],
      }
    );
  }
}
