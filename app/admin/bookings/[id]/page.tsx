'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URLS } from "@/utils/constants";
import { use } from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
  Select,
  SelectItem,
} from "@nextui-org/react";

interface Booking {
    id: number;
    room_type: string;
    check_in_date: string;
    check_in_time: string;
    check_out_date: string;
    check_out_time: string;
    guest_count: number;
    total_price: number;
    notes: string | null;
    guest_name: string;
    guest_phone: string;
    status: string;
    paid_status: string;
  }

export default function BookingDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await axios.get(
          `${API_URLS.BACKEND_URL}/api/bookings/${resolvedParams.id}`
        );
        
        if (response.data && response.data.id) {
          setBooking(response.data);
        } else {
          setError('Invalid booking data received');
        }
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [resolvedParams.id, router]);

  const handlePaidStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URLS.BACKEND_URL}/api/bookings/${booking?.id}/payment-status`,
        { paid_status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBooking(prev => prev ? { ...prev, paid_status: newStatus } : null);
    } catch (err) {
      setError('Failed to update payment status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <Button
          color="primary"
          variant="light"
          onPress={() => router.push('/admin/bookings')}
        >
          Back to Bookings
        </Button>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Guest Information</h3>
              <p>Name: {booking?.guest_name}</p>
              <p>Phone: {booking?.guest_phone}</p>
            </div>
            <div>
              <h3 className="font-semibold">Booking Status</h3>
              <Chip
                color={booking.status === 'confirmed' ? 'success' : 'danger'}
                className="mt-2"
              >
                {booking.status.toUpperCase()}
              </Chip>
            </div>
          </div>

          <Divider className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Room Details</h3>
              <p>Type: {booking.room_type}</p>
              <p>Guests: {booking.guest_count}</p>
              <p>Price: ${booking.total_price.toFixed(2)}</p>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Payment Status</h3>
                <Select
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePaidStatusChange(e.target.value)}
                    value={booking.paid_status}
                >
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                </Select>
            </div>
            </div>
            <div>
              <h3 className="font-semibold">Check-in/out</h3>
              <p>Check-in: {booking.check_in_date} at {booking.check_in_time}</p>
              <p>Check-out: {booking.check_out_date} at {booking.check_out_time}</p>
            </div>
          </div>



          {booking.notes && (
            <>
              <Divider className="my-4" />
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{booking.notes}</p>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}