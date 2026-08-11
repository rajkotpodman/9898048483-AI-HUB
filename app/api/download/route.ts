import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';

export async function GET() {
  const pythonAppDir = path.join(process.cwd(), 'python_server_app');

  if (!fs.existsSync(pythonAppDir)) {
    return new NextResponse('Directory not found', { status: 404 });
  }

  const zip = new AdmZip();
  zip.addLocalFolder(pythonAppDir);
  const zipBuffer = zip.toBuffer();

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="SecureFolderShare_Source.zip"',
    },
  });
}
