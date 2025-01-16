'use client';

import { useState } from 'react';
import { Card, CardBody, Input, Button } from "@nextui-org/react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URLS } from "@/utils/constants";

interface LoginForm {
  username: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<LoginForm>({
    username: '',
    password: ''
  });

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URLS.BACKEND_URL}/admin/login`, formData);
      
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-white bg-danger-400 rounded">
                {error}
              </div>
            )}

            <Input
              label="Username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              isRequired
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              isRequired
            />

            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Login
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}