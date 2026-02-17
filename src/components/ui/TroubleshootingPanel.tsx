import React, { useState } from 'react';

interface TroubleshootingPanelProps {
  error?: string;
  isDevelopment?: boolean;
}

const TroubleshootingPanel: React.FC<TroubleshootingPanelProps> = ({
  error,
  isDevelopment = process.env.NODE_ENV === 'development',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isDevelopment || !error) {
    return null;
  }

  const troubleshootingInfo = {
    'Cannot connect to server': {
      checks: [
        {
          label: 'Web BFF Status',
          command: 'Check if running on port 8014',
          check: 'curl http://localhost:8014/health/ready',
        },
        { label: 'Network Tab', command: 'Open browser DevTools → Network tab → Check failed requests', check: '' },
        { label: 'CORS Issues', command: 'Check browser console for CORS-related errors', check: '' },
        {
          label: 'Environment Config',
          command: 'Verify REACT_APP_BFF_API_URL in .env file',
          check: 'echo %REACT_APP_BFF_API_URL%',
        },
      ],
      possibleCauses: [
        'Web BFF is not running',
        'Incorrect BFF URL in environment configuration',
        'CORS policy blocking the request',
        'Firewall or network blocking the connection',
      ],
    },
    'Backend service unavailable': {
      checks: [
        {
          label: 'Auth Service Status',
          command: 'Check if auth-service is running',
          check: 'curl http://localhost:8004/health/ready',
        },
        { label: 'BFF Logs', command: 'Check Web BFF logs for connection errors', check: '' },
        { label: 'Service Dependencies', command: 'Verify all microservices are running', check: '' },
      ],
      possibleCauses: [
        'Auth service is not running',
        'BFF cannot connect to auth service',
        'Auth service database connection failed',
      ],
    },
  };

  // Find matching troubleshooting info
  const matchedKey = Object.keys(troubleshootingInfo).find((key) => error.includes(key));
  const info = matchedKey ? troubleshootingInfo[matchedKey as keyof typeof troubleshootingInfo] : null;

  if (!info) {
    return null;
  }

  return (
    <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-gray-900 dark:text-white">🔧 Developer Troubleshooting</span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Possible Causes */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Possible Causes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {info.possibleCauses.map((cause, idx) => (
                <li key={idx}>{cause}</li>
              ))}
            </ul>
          </div>

          {/* Diagnostic Checks */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Diagnostic Checks:</h4>
            <div className="space-y-2">
              {info.checks.map((check, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{check.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{check.command}</div>
                      {check.check && (
                        <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
                          {check.check}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Links:</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open('http://localhost:8014/health/ready', '_blank')}
                className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
              >
                Check BFF Health
              </button>
              <button
                onClick={() => {
                  console.log('%c🔍 Current Configuration:', 'color: #2563eb; font-weight: bold; font-size: 14px;');
                  console.log('BFF URL:', process.env.REACT_APP_BFF_API_URL || 'http://localhost:8014');
                  console.log('Environment:', process.env.NODE_ENV);
                  console.log('Build Time:', new Date().toISOString());
                }}
                className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded"
              >
                Show Config in Console
              </button>
              <button
                onClick={() => {
                  console.log('%c📋 Checking Services...', 'color: #7c3aed; font-weight: bold; font-size: 14px;');

                  const services = [
                    { name: 'Web BFF', url: 'http://localhost:8014/health/ready' },
                    { name: 'Auth Service', url: 'http://localhost:8004/health/ready' },
                    { name: 'User Service', url: 'http://localhost:8002/health/ready' },
                  ];

                  services.forEach(async (service) => {
                    try {
                      const response = await fetch(service.url);
                      console.log(`✅ ${service.name}: ${response.ok ? 'UP' : 'DOWN'}`);
                    } catch (error) {
                      console.log(`❌ ${service.name}: UNREACHABLE`);
                    }
                  });
                }}
                className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded"
              >
                Check All Services
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TroubleshootingPanel;
