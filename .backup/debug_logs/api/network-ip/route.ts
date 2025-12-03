import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  try {
    // Get all network interfaces
    const networkInterfaces = os.networkInterfaces();
    const candidates: string[] = [];
    
    // First pass: collect all potential IPs
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((iface) => {
          // Only consider IPv4 addresses that are not internal
          if (!iface.internal && iface.family === 'IPv4') {
            candidates.push(iface.address);
          }
        });
      }
    });
    
    console.log('Network IP candidates:', candidates);
    
    // Prioritize IPs in order:
    // 1. 192.168.*.* (common home/office networks)
    // 2. 10.*.*.* (common enterprise networks)
    // 3. 172.16-31.*.* (less common but valid private ranges)
    // 4. Any other non-internal IP
    
    // Find 192.168.*.* addresses (most common for home networks)
    const ip192 = candidates.find(ip => ip.startsWith('192.168.'));
    if (ip192) {
      console.log('Using 192.168.*.* network IP:', ip192);
      return NextResponse.json({ ip: ip192 });
    }
    
    // Find 10.*.*.* addresses (common for larger networks)
    const ip10 = candidates.find(ip => ip.startsWith('10.'));
    if (ip10) {
      console.log('Using 10.*.*.* network IP:', ip10);
      return NextResponse.json({ ip: ip10 });
    }
    
    // Find 172.16-31.*.* addresses (less common private ranges)
    const ip172 = candidates.find(ip => {
      const parts = ip.split('.');
      return parts[0] === '172' && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31;
    });
    if (ip172) {
      console.log('Using 172.16-31.*.* network IP:', ip172);
      return NextResponse.json({ ip: ip172 });
    }
    
    // Use any other candidate if available
    if (candidates.length > 0) {
      console.log('Using first available network IP:', candidates[0]);
      return NextResponse.json({ ip: candidates[0] });
    }
    
    // If no suitable IP was found, use localhost as a fallback
    console.log('No suitable network IP found, using localhost');
    return NextResponse.json({ ip: '127.0.0.1' });
  } catch (error) {
    console.error('Error getting network IP:', error);
    return NextResponse.json({ error: 'Failed to get network IP' }, { status: 500 });
  }
}
