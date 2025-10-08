'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../lib/components/layout';
import { ProtectedRoute } from '../../lib/components/auth/ProtectedRoute';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../../lib/components/ui';
import { useAuth } from '../../lib/contexts/AuthContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { 
  Settings, 
  User, 
  Palette, 
  Database, 
  Bell, 
  Shield, 
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    currency: 'NPR',
    dateFormat: 'DD/MM/YYYY',
    lowStockThreshold: 5,
    autoBackup: true,
    emailNotifications: true,
    pushNotifications: false
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAppSettingsUpdate = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout title="Settings">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account and application preferences
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <Card className={`p-4 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                message.type === 'success' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {message.text}
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </Card>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Full Name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          fullWidth
                        />
                        <Input
                          label="Email Address"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          fullWidth
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-medium mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <Input
                            label="Current Password"
                            type="password"
                            value={profileData.currentPassword}
                            onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            fullWidth
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="New Password"
                              type="password"
                              value={profileData.newPassword}
                              onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                              fullWidth
                            />
                            <Input
                              label="Confirm New Password"
                              type="password"
                              value={profileData.confirmPassword}
                              onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              fullWidth
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" loading={loading}>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Theme</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose your preferred theme
                        </p>
                      </div>
                      <Button onClick={toggleTheme} variant="outline">
                        {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Currency</label>
                      <select
                        value={appSettings.currency}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, currency: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="NPR">NPR (Nepalese Rupee)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="INR">INR (Indian Rupee)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Date Format</label>
                      <select
                        value={appSettings.dateFormat}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleAppSettingsUpdate} loading={loading}>
                        <Save size={16} className="mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive email alerts for important events
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.emailNotifications}
                          onChange={(e) => setAppSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Low Stock Alerts</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Get notified when inventory is running low
                        </p>
                      </div>
                      <Input
                        type="number"
                        value={appSettings.lowStockThreshold}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                        className="w-20"
                        min="1"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleAppSettingsUpdate} loading={loading}>
                        <Save size={16} className="mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Management Tab */}
              {activeTab === 'data' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2">Export Data</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Download all your transactions and inventory data
                        </p>
                        <Button onClick={handleDataExport} loading={loading} variant="outline" fullWidth>
                          <Download size={16} className="mr-2" />
                          Export Data
                        </Button>
                      </div>

                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <h3 className="font-medium mb-2">Import Data</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Import transactions from CSV or Excel files
                        </p>
                        <Button variant="outline" fullWidth>
                          <Upload size={16} className="mr-2" />
                          Import Data
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          Permanently delete all your data. This action cannot be undone.
                        </p>
                        <Button variant="error">
                          <Trash2 size={16} className="mr-2" />
                          Delete All Data
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium mb-2">Active Sessions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        You are currently signed in on 1 device
                      </p>
                      <Button variant="outline">
                        View All Sessions
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="border-t pt-6">
                      <Button onClick={logout} variant="error">
                        Sign Out of All Devices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}