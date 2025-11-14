import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readVideos() {
  try {
    const data = await fs.readFile(VIDEOS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { videos: [] };
  }
}

async function writeVideos(data: any) {
  await ensureDataDir();
  await fs.writeFile(VIDEOS_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const data = await readVideos();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading videos:", error);
    return NextResponse.json({ videos: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoURL, duration, type, quality } = body;

    const privateDir = process.env.PRIVATE_OBJECT_DIR || "";
    const videoPath = videoURL.replace("https://storage.googleapis.com", "").split("?")[0];
    const normalizedPath = `/objects${videoPath.replace(privateDir, "")}`;

    const data = await readVideos();
    const video = {
      id: Date.now().toString(),
      videoPath: normalizedPath,
      duration,
      type,
      quality,
      views: 0,
      createdAt: new Date().toISOString(),
    };

    data.videos.unshift(video);
    await writeVideos(data);

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error saving video:", error);
    return NextResponse.json(
      { error: "Failed to save video" },
      { status: 500 }
    );
  }
}
