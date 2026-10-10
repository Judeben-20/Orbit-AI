import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return new NextResponse(
      `
      <html>
        <body>
          <script>
            window.opener?.postMessage('connection_success', '*');
            window.close();
          </script>
          <p>Connection successful. You can close this window.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    console.error("[CONNECTIONS_CALLBACK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
