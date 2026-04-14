import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { proxy: string[] } }
) {
  return handleProxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { proxy: string[] } }
) {
  return handleProxyRequest(request, params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proxy: string[] } }
) {
  return handleProxyRequest(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { proxy: string[] } }
) {
  return handleProxyRequest(request, params);
}

async function handleProxyRequest(
  request: NextRequest,
  params: { proxy: string[] }
) {
  const backendUrl = process.env.BACKEND_URL;
  const apiKey = process.env.API_SECRET_KEY;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "BACKEND_URL is not configured on the server." },
      { status: 500 }
    );
  }

  const path = params.proxy ? params.proxy.join("/") : "";
  // Forward search params (query string)
  const searchParams = request.nextUrl.searchParams.toString();
  const urlParams = searchParams ? `?${searchParams}` : "";
  const targetUrl = `${backendUrl}/${path}${urlParams}`;

  try {
    const headers = new Headers(request.headers);
    // Remove host header to avoid conflicts with backend
    headers.delete("host");
    
    if (apiKey) {
      headers.set("X-API-Key", apiKey);
    }

    const init: RequestInit = {
      method: request.method,
      headers: headers,
      // Pass along the body for non-GET/HEAD methods
      ...(request.method !== "GET" && request.method !== "HEAD"
        ? { body: await request.text() }
        : {}),
    };

    const response = await fetch(targetUrl, init);

    // Proxy the response back
    const responseHeaders = new Headers(response.headers);
    // Next.js handles these encoding headers
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`Proxy Error for ${targetUrl}:`, error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 502 }
    );
  }
}
