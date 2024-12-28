// api/sync.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const body = await req.json();
    const { direction } = body;

    // 在 Vercel 环境中使用 Edge Function
    const response = await fetch('https://api.garmin.cn/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GARMIN_TOKEN}`
      },
      body: JSON.stringify({
        direction,
        username: process.env.GARMIN_USERNAME,
        password: process.env.GARMIN_PASSWORD
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}