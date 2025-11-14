import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { Readable } from "stream";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const objectPath = pathArray.join("/");
    
    const privateDir = process.env.PRIVATE_OBJECT_DIR || "";
    const fullPath = `${privateDir}/${objectPath}`;
    
    const parts = fullPath.slice(1).split("/");
    const bucketName = parts[0];
    const objectName = parts.slice(1).join("/");

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const [metadata] = await file.getMetadata();
    
    const rangeHeader = request.headers.get("range");
    const fileSize = parseInt(metadata.size?.toString() || "0");
    
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const nodeStream = file.createReadStream({ start, end });
      const webStream = Readable.toWeb(nodeStream as any);
      
      return new Response(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": metadata.contentType || "video/webm",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream as any);
    
    return new Response(webStream as any, {
      headers: {
        "Content-Type": metadata.contentType || "video/webm",
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving object:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
