'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import axios from 'axios';
import moment from 'moment';
import { API_URLS } from "@/utils/constants";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Divider,
  Select,
  SelectItem,
  Input,
} from "@nextui-org/react";

interface Booking {
  id: number;
  guest_name: string;
  guest_phone: string;
  room_type: string;
  room_number: string | null;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string;
  check_out_time: string;
  guest_count: number;
  total_price: number;
  status: string;
  paid_status: string;
  verification_status: 'pending' | 'verified' | 'not_verified';
  notes?: string;
}

export default function BookingDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const isCheckInDay = booking ? 
    moment(booking.check_in_date).isSame(moment(), 'day') : false;

  const isApproachingCheckIn = booking ? 
    moment(booking.check_in_date).diff(moment(), 'days') <= 1 : false;

  useEffect(() => {
    fetchBooking();
  }, [resolvedParams.id]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(
        `${API_URLS.BACKEND_URL}/api/bookings/${resolvedParams.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.id) {
        setBooking(response.data);
        setRoomNumber(response.data.room_number || '');
      } else {
        setError('Invalid booking data received');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (updateData: Partial<Booking>) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URLS.BACKEND_URL}/api/admin/bookings/${resolvedParams.id}/update`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchBooking();
    } catch (err) {
      setError('Failed to update booking');
    }
  };

  const handleSendReminder = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URLS.BACKEND_URL}/api/admin/bookings/${resolvedParams.id}/notify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      setError('Failed to send reminder');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!booking) return <div>Booking not found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Details #{booking.id}</h1>
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
              <p>Name: {booking.guest_name}</p>
              <p>Phone: {booking.guest_phone}</p>
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
                  value={booking.paid_status}
                  onChange={(e) => handleStatusUpdate({ paid_status: e.target.value })}
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

              {isCheckInDay && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Verification Status</h3>
                  <Select
                    value={booking.verification_status}
                    onChange={(e) => handleStatusUpdate({ verification_status: e.target.value as 'pending' | 'verified' | 'not_verified' })}
                  >
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="not_verified">Not Verified</SelectItem>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {booking.verification_status === 'verified' && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Room Assignment</h3>
              <div className="flex gap-2">
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Enter room number"
                />
                <Button
                  color="primary"
                  onPress={() => handleStatusUpdate({ room_number: roomNumber })}
                >
                  Assign Room
                </Button>
              </div>
            </div>
          )}

          {isApproachingCheckIn && (
            <div className="mt-4">
              <Button
                color="warning"
                onPress={handleSendReminder}
              >
                Send Check-in Reminder
              </Button>
            </div>
          )}

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