import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL;
  const apiKey = process.env.API_SECRET_KEY;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL is not configured on the server." },
      { status: 500 }
    );
  }

  const targetUrl = `${backendUrl}/stream`;

  try {
    const headers = new Headers();
    if (apiKey) {
      headers.set("X-API-Key", apiKey);
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      // Important to keep the stream open without caching
      cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Backend streaming failed with status ${response.status}`);
    }

    // Proxy the stream back to the client directly
    // Using Next 14 standard edge streaming
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error(`Stream Proxy Error:`, error);
    return NextResponse.json(
      { error: "Failed to connect to backend stream" },
      { status: 502 }
    );
  }
}
