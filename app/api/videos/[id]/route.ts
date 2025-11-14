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

async function writeVideos(data: any) {
  await fs.writeFile(VIDEOS_FILE, JSON.stringify(data, null, 2));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await readVideos();
    data.videos = data.videos.filter((v: any) => v.id !== id);
    await writeVideos(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
