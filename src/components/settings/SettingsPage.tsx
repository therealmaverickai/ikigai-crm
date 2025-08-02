import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { supabaseApiSimple } from '../../database/supabaseClientSimple';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsPage = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    const loginStatus = localStorage.getItem('crm_logged_in');
    
    if (savedUser && loginStatus === 'true') {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser({
          ...userData,
          createdAt: new Date(userData.createdAt),
          updatedAt: new Date(userData.updatedAt),
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('crm_user');
        localStorage.removeItem('crm_logged_in');
      }
    }
  }, []);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newUser = await supabaseApiSimple.createUser({
        username: username.trim(),
        email: email.trim() || undefined,
        password: password.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined
      });

      // Save user data locally for session management
      localStorage.setItem('crm_user', JSON.stringify(newUser));
      localStorage.setItem('crm_logged_in', 'true');
      
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setIsRegistering(false);
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.message?.includes('duplicate key')) {
        setError('Username or email already exists');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await supabaseApiSimple.loginUser(loginUsername.trim(), loginPassword.trim());
      
      // Save user data locally for session management
      localStorage.setItem('crm_user', JSON.stringify(user));
      localStorage.setItem('crm_logged_in', 'true');
      
      setCurrentUser(user);
      setIsLoggedIn(true);
      setLoginUsername('');
      setLoginPassword('');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem('crm_logged_in', 'false');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setLoginUsername('');
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError('Please enter a new username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updatedUser = await supabaseApiSimple.updateUser(currentUser!.id, {
        username: username.trim()
      });

      // Update local storage
      localStorage.setItem('crm_user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setUsername('');
      alert('Username updated successfully!');
    } catch (error: any) {
      console.error('Update failed:', error);
      if (error.message?.includes('duplicate key')) {
        setError('Username already exists');
      } else {
        setError(error.message || 'Update failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently remove your user profile from the cloud database but keep your CRM data.')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await supabaseApiSimple.deleteUser(currentUser!.id);
      
      localStorage.removeItem('crm_user');
      localStorage.removeItem('crm_logged_in');
      setCurrentUser(null);
      setIsLoggedIn(false);
      alert('Account deleted successfully.');
    } catch (error: any) {
      console.error('Delete failed:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your user account and preferences</p>
        </div>
      </div>

      {!isLoggedIn ? (
        // Login/Register Section
        <div className="max-w-md mx-auto">
          <Card>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {isRegistering 
                  ? 'Set up your CRM user profile' 
                  : 'Login to access your CRM settings'
                }
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {isRegistering ? (
              // Registration Form
              <div className="space-y-4">
                <Input
                  label="Username *"
                  value={username}
                  onChange={setUsername}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
                <Input
                  label="Password *"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name (optional)"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="First name"
                    disabled={isLoading}
                  />
                  <Input
                    label="Last Name (optional)"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Last name"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleRegister}
                    variant="primary"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Account'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsRegistering(false);
                      setError('');
                    }}
                    variant="ghost"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              // Login Form
              <div className="space-y-4">
                <Input
                  label="Username"
                  value={loginUsername}
                  onChange={setLoginUsername}
                  placeholder="Enter your username"
                  required
                  disabled={isLoading}
                />
                <Input
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleLogin}
                    variant="primary"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsRegistering(true);
                      setError('');
                    }}
                    variant="ghost"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        // User Dashboard
        <div className="space-y-6">
          {/* Current User Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 User Profile</h3>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Logged in as</h4>
                    <p className="text-green-700 text-lg">{currentUser?.username}</p>
                    {currentUser?.email && (
                      <p className="text-green-600 text-sm">{currentUser.email}</p>
                    )}
                    {(currentUser?.firstName || currentUser?.lastName) && (
                      <p className="text-green-600 text-sm">
                        {[currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ')}
                      </p>
                    )}
                    <p className="text-green-600 text-xs">
                      Account created: {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    {currentUser?.lastLogin && (
                      <p className="text-green-600 text-xs">
                        Last login: {new Date(currentUser.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Update Profile */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Update Profile</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <Input
                label="New Username"
                value={username}
                onChange={setUsername}
                placeholder={`Current: ${currentUser?.username}`}
                disabled={isLoading}
              />
              <Button 
                onClick={handleUpdateUsername}
                variant="primary"
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Username'}
              </Button>
            </div>
          </Card>

          {/* CRM Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🌐 CRM Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-800">Cloud Database</div>
                  <div className="text-blue-600 text-sm">All CRM data and user accounts saved to Supabase</div>
                </div>
                <div className="text-blue-500">✅ Connected</div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-800">Weekly Timesheet</div>
                  <div className="text-green-600 text-sm">Time tracking with cloud persistence</div>
                </div>
                <div className="text-green-500">✅ Active</div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-800">User Authentication</div>
                  <div className="text-purple-600 text-sm">Cloud-based user management with encrypted passwords</div>
                </div>
                <div className="text-purple-500">✅ {currentUser?.username}</div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card>
            <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Danger Zone</h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                <p className="text-red-600 text-sm mb-3">
                  This will permanently delete your user profile from the cloud database but keep all your CRM data (companies, projects, time entries) intact.
                </p>
                <Button 
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;