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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URLS } from "@/utils/constants";
import moment from 'moment';

// Add helper function to check if date is today
const isToday = (dateString: string) => {
    return moment(dateString).isSame(moment(), 'day');
  };

interface Booking {
    id: number;
    user: {
      id: number;
      name: string;
      phone: string;
    };
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
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'checkinToday' | 'checkoutToday'>('all');
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await fetch(`${API_URLS.BACKEND_URL}/admin/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch bookings');
        
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  const handleCancelClick = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingId) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${API_URLS.BACKEND_URL}/api/admin/bookings/${selectedBookingId}`,
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setBookings(bookings.filter(booking => booking.id !== selectedBookingId));
      setIsModalOpen(false);
    } catch (error) {
      setError('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return statusFilter === 'all' || booking.status === statusFilter;

    const matchesSearch = 
      (booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.user?.phone?.includes(searchTerm) || false) ||
      (booking.room_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    const today = moment();
    if (dateFilter === 'checkinToday') {
        matchesDate = moment(booking.check_in_date).isSame(today, 'day');
    } else if (dateFilter === 'checkoutToday') {
        matchesDate = moment(booking.check_out_date).isSame(today, 'day');
    }

    return matchesSearch && matchesStatus && matchesDate;
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

            <div className="w-48">
                <Select 
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                >
                <SelectItem key="all" value="all">All Dates</SelectItem>
                <SelectItem key="checkinToday" value="checkinToday">Check-in Today</SelectItem>
                <SelectItem key="checkoutToday" value="checkoutToday">Check-out Today</SelectItem>
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
                      <div className="font-medium">{booking.user?.name}</div>
                      <div className="text-sm text-gray-500">{booking.user?.phone}</div>
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
                        onPress={() => handleCancelClick(booking.id)}
                        >
                        Cancel
                        </Button>
                      )}
                      <Modal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)}
                    >
                        <ModalContent>
                        <ModalHeader>Confirm Cancellation</ModalHeader>
                        <ModalBody>
                            Are you sure you want to cancel this booking?
                            This action cannot be undone.
                        </ModalBody>
                        <ModalFooter>
                            <Button
                            color="default"
                            variant="flat"
                            onPress={() => setIsModalOpen(false)}
                            >
                            Close
                            </Button>
                            <Button 
                            color="danger" 
                            onPress={handleConfirmCancel}
                            >
                            Confirm Cancel
                            </Button>
                        </ModalFooter>
                        </ModalContent>
                    </Modal>
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