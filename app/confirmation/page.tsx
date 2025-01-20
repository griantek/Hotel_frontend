'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Card, CardBody, Button, Skeleton } from "@nextui-org/react";
import { CheckCircle } from "lucide-react";
import { API_URLS, CHATBOT_NUMBER } from "@/utils/constants";
interface BookingDetails {
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
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get(`${API_URLS.BACKEND_URL}/api/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Skeleton className="h-64 rounded-lg"/>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardBody>
            <p className="text-center text-danger">{error || 'Booking not found'}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const formatDateTime = (date: string, time: string) => {
    const datetime = new Date(`${date}T${time}`);
    return datetime.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardBody className="space-y-6">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success mr-2" />
            <h1 className="text-xl font-semibold">Booking Confirmed</h1>
          </div>

            <div className="rounded-lg space-y-3 p-4">
            <div>
              <p className="text-sm text-gray-500">Guest</p>
              <p className="font-small">{booking.guest_name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Room</p>
              <p className="font-medium">{booking.room_type} • {booking.guest_count} guests</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-medium">{formatDateTime(booking.check_in_date, booking.check_in_time)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-medium">{formatDateTime(booking.check_out_date, booking.check_out_time)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="font-medium">${booking.total_price.toFixed(2)}</p>
            </div>
          </div>

          <Button
            color="primary"
            variant="flat"
            className="w-full"
            onClick={() => window.location.href = `https://wa.me/${CHATBOT_NUMBER}`}
          >
            Contact via WhatsApp
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}