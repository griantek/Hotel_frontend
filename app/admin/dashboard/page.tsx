'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip
} from "@nextui-org/react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URLS } from "@/utils/constants";

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  roomStats: {
    [key: string]: {
      total: number;
      occupied: number;
    }
  };
  recentBookings: Array<{
    id: number;
    guest_name: string;
    check_in_date: string;
    room_type: string;
    total_price: number;
    status: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await axios.get(`${API_URLS.BACKEND_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to fetch dashboard stats');
        if (error.response?.status === 401) {
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardBody className="text-center">
            <h3 className="text-xl mb-2">Total Bookings</h3>
            <p className="text-3xl font-bold text-primary">
              {stats?.totalBookings || 0}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <h3 className="text-xl mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-success">
            ${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center">
            <h3 className="text-xl mb-2">Occupancy Rate</h3>
            <p className="text-3xl font-bold text-warning">
              {stats?.occupancyRate.toFixed(1) || 0}%
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Room Status */}
      <Card className="mb-6">
        <CardBody>
          <h2 className="text-xl font-bold mb-4">Room Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.roomStats && Object.entries(stats.roomStats).map(([type, data]) => (
              <Card key={type} className="bg-content2">
                <CardBody>
                  <h4 className="font-medium">{type}</h4>
                  <div className="flex justify-between mt-2">
                    <span>Occupied: {data.occupied}</span>
                    <span>Total: {data.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-primary rounded-full h-2.5"
                      style={{ width: `${(data.occupied / data.total) * 100}%` }}
                    ></div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
          <Table aria-label="Recent bookings table">
            <TableHeader>
              <TableColumn>BOOKING ID</TableColumn>
              <TableColumn>GUEST</TableColumn>
              <TableColumn>CHECK-IN</TableColumn>
              <TableColumn>ROOM TYPE</TableColumn>
              <TableColumn>AMOUNT</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {stats?.recentBookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>#{booking.id}</TableCell>
                  <TableCell>{booking.guest_name}</TableCell>
                  <TableCell>{booking.check_in_date}</TableCell>
                  <TableCell>{booking.room_type}</TableCell>
                  <TableCell>${booking.total_price}</TableCell>
                  <TableCell>
                    <Chip
                      color={booking.status === 'confirmed' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {booking.status}
                    </Chip>
                  </TableCell>
                </TableRow>
              )) || []}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}