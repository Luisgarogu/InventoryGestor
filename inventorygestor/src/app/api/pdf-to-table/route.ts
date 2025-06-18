import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file) return new Response("No file", { status: 400 });

  const py = await fetch("http://localhost:8000/table", {
    method: "POST",
    body: (() => {
      const f = new FormData();
      f.append("file", file, file.name);
      return f;
    })(),
  });

  if (!py.ok)
    return new Response(await py.text(), { status: py.status });

  const csv = await py.text();
  return new Response(csv, { headers: { "Content-Type": "text/csv" } });
}
