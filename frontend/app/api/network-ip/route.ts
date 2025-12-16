import { NextRequest, NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

export async function GET(request: NextRequest) {
  try {
    const nets = networkInterfaces();
    let networkIp = 'localhost';

    // Find the first non-internal IPv4 address
    for (const name of Object.keys(nets)) {
      const netInterface = nets[name];
      if (netInterface) {
        for (const net of netInterface) {
          // Skip internal addresses and IPv6
          if (net.family === 'IPv4' && !net.internal) {
            networkIp = net.address;
            break;
          }
        }
        if (networkIp !== 'localhost') break;
      }
    }

    return NextResponse.json({ ip: networkIp });
  } catch (error) {
    console.error('Error getting network IP:', error);
    return NextResponse.json({ ip: 'localhost' });
  }
}