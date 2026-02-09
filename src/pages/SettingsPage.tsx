import React, { useState } from 'react';
import {
  UserCircleIcon,
  BellIcon,
  PaintBrushIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // Get admin user from localStorage (set during login)
  const adminEmail = localStorage.getItem('admin_email') || 'admin@xshopai.com';

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    lowStock: true,
    newReviews: true,
    newUsers: false,
    systemAlerts: true,
  });

  const handleSaveSettings = () => {
    // Save notification preferences to localStorage
    localStorage.setItem('notification_preferences', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="card p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5" />
            <p className="text-sm font-medium">Settings saved successfully!</p>
          </div>
        </div>
      )}

      {/* Profile & Account */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UserCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile & Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={adminEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed. Contact system administrator.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <input
              type="text"
              value="Administrator"
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => alert('Change password feature coming soon')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Change Password
            </button>
            <button
              onClick={() => alert('Edit profile feature coming soon')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <PaintBrushIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize how the app looks</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current theme: {isDarkMode ? 'Dark' : 'Light'}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Toggle to {isDarkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BellIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage email notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Order Updates</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified when orders are placed or status changes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.orderUpdates}
                onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Low Stock Alerts</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive alerts when products are running low</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.lowStock}
                onChange={(e) => setNotifications({ ...notifications, lowStock: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">New Reviews</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when customers submit new reviews</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.newReviews}
                onChange={(e) => setNotifications({ ...notifications, newReviews: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">New User Registrations</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about new customer signups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.newUsers}
                onChange={(e) => setNotifications({ ...notifications, newUsers: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">System Alerts</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Important system notifications and updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.systemAlerts}
                onChange={(e) => setNotifications({ ...notifications, systemAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <InformationCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">System information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Version</p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">v1.0.0</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Build Date</p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">February 9, 2026</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Environment</p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">Production</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Backend API</p>
            <p className="text-base text-gray-900 dark:text-white font-semibold">Connected</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
