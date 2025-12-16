'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, Users, Activity, Database } from 'lucide-react';

export default function AdminSecurityPage() {
  const [securityData, setSecurityData] = useState({
    activeThreats: 0,
    blockedAttempts: 24,
    secureConnections: 98.5,
    lastScan: '2 hours ago',
    vulnerabilities: 0,
    activeUsers: 156
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Security Dashboard
          </h1>
          <p className="text-gray-600">Monitor system security, threats, and access controls</p>
        </div>

        {/* Security Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 shadow-md">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Security Status</p>
                  <p className="text-2xl font-bold text-green-600">SECURE</p>
                  <p className="text-sm text-gray-600 mt-1">All systems protected</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 shadow-md">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Threats</p>
                  <p className="text-3xl font-bold text-gray-900">{securityData.activeThreats}</p>
                  <p className="text-sm text-green-600 mt-1">No threats detected</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="px-6 py-8">
              <div className="flex items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Blocked Attempts</p>
                  <p className="text-3xl font-bold text-gray-900">{securityData.blockedAttempts}</p>
                  <p className="text-sm text-gray-600 mt-1">Last 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-3 text-blue-600" />
                Security Metrics
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Secure Connections</span>
                  <span className="text-2xl font-bold text-green-600">{securityData.secureConnections}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">SSL Certificate</span>
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Valid
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Last Security Scan</span>
                  <span className="text-gray-600">{securityData.lastScan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Vulnerabilities</span>
                  <span className="text-2xl font-bold text-green-600">{securityData.vulnerabilities}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Eye className="h-6 w-6 mr-3 text-purple-600" />
                Recent Security Events
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { event: 'Failed login attempt blocked', time: '5 minutes ago', severity: 'medium' },
                  { event: 'SSL certificate renewed', time: '2 hours ago', severity: 'low' },
                  { event: 'Security scan completed', time: '4 hours ago', severity: 'low' },
                  { event: 'Suspicious IP blocked', time: '6 hours ago', severity: 'high' },
                  { event: 'Password policy updated', time: '1 day ago', severity: 'low' },
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                    <div className={`h-3 w-3 rounded-full ${
                      event.severity === 'high' ? 'bg-red-500' :
                      event.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-gray-900 font-medium flex-1">{event.event}</span>
                    <span className="text-gray-500 text-sm">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Controls */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Database className="h-6 w-6 mr-3 text-indigo-600" />
              Security Controls
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold text-blue-600">Firewall</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <Lock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold text-green-600">2FA</div>
                <div className="text-sm text-green-600">Enabled</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <Eye className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-bold text-purple-600">Monitoring</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-lg font-bold text-orange-600">Access Control</div>
                <div className="text-sm text-green-600">Enforced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}