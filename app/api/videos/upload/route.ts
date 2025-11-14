import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

async function signObjectURL(bucketName: string, objectName: string, method: string, ttlSec: number): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };

  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to sign object URL, errorcode: ${response.status}`);
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

export async function POST() {
  try {
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    if (!privateDir) {
      return NextResponse.json(
        { error: "Object storage not configured" },
        { status: 500 }
      );
    }

    const videoId = randomUUID();
    const fullPath = `${privateDir}/videos/${videoId}.webm`;
    
    const parts = fullPath.slice(1).split("/");
    const bucketName = parts[0];
    const objectName = parts.slice(1).join("/");

    const uploadURL = await signObjectURL(bucketName, objectName, "PUT", 900);

    return NextResponse.json({ uploadURL });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
