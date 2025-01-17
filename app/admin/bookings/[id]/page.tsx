'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URLS } from "@/utils/constants";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
} from "@nextui-org/react";

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

export default function BookingDetails({ params }: { params: { id: string } }) {
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
          `${API_URLS.BACKEND_URL}/api/bookings/${params.id}`
        );
        setBooking(response.data);
      } catch (err) {
        setError('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, router]);

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
              <p>Name: {booking.user.name}</p>
              <p>Phone: {booking.user.phone}</p>
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