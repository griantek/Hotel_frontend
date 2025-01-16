'use client';

import { useEffect, useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Select,
  SelectItem,
} from "@nextui-org/react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URLS } from "@/utils/constants";

interface Booking {
  id: number;
  guest_name: string;
  guest_phone: string;
  room_type: string;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  paid_status: string;
  notes?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await axios.get(`${API_URLS.BACKEND_URL}/admin/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(response.data);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to fetch bookings');
        if (error.response?.status === 401) {
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URLS.BACKEND_URL}/api/bookings/${bookingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? {...booking, status: newStatus} : booking
      ));
    } catch (error) {
      setError('Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_phone.includes(searchTerm) ||
      booking.room_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.total_price, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Booking Management</h1>
      
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <div className="w-64">
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-48">
              <Select 
                placeholder="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <SelectItem key="all" value="all">All Bookings</SelectItem>
                <SelectItem key="confirmed" value="confirmed">Confirmed</SelectItem>
                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
              </Select>
            </div>

            <div className="flex gap-2">
              <Chip color="success">
                Total Revenue: ${totalRevenue.toFixed(2)}
              </Chip>
              <Chip color="primary">
                Total Bookings: {filteredBookings.length}
              </Chip>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-white bg-danger-400 rounded">
              {error}
            </div>
          )}

          <Table aria-label="Bookings table">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>GUEST</TableColumn>
              <TableColumn>ROOM</TableColumn>
              <TableColumn>DATES</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-sm text-gray-500">{booking.guest_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{booking.room_type}</div>
                      <div className="text-sm text-gray-500">{booking.guest_count} guests</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>In: {booking.check_in_date} {booking.check_in_time}</div>
                      <div>Out: {booking.check_out_date} {booking.check_out_time}</div>
                    </div>
                  </TableCell>
                  <TableCell>${booking.total_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      color={booking.status === 'confirmed' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {booking.status.toUpperCase()}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => router.push(`/admin/bookings/${booking.id}`)}
                      >
                        View
                      </Button>
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => handleStatusChange(booking.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}