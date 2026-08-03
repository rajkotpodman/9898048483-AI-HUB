import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { modelName, prompt, apiKey } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Secure proxy logic here
    
    // Wait a little to simulate network
    await new Promise(r => setTimeout(r, 1000));
    
    const code = `// Auto-generated securely via backend proxy by ${modelName}\n\nfunction helloWorld() {\n  console.log("Hello from ${modelName}!");\n}\n\nhelloWorld();\n`;

    return NextResponse.json({ code });
  } catch (error: any) {
    console.error('Error in code proxy:', error);
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }
}
