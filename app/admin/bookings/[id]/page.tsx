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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
  verification_status:string;
  notes?: string;
  checkout_reminder_sent: boolean;
  checkin_status: string;
}

export default function BookingDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roomTypes, setRoomTypes] = useState<Array<{type: string, price: number}>>([]);
  const [updatedBooking, setUpdatedBooking] = useState<Partial<Booking>>({
    room_type: '',
    check_in_date: '',
    check_in_time: '',
    check_out_date: '', 
    check_out_time: '',
    guest_count: 1,
    notes: ''
  });
  const [availability, setAvailability] = useState<{
    available: boolean;
    remainingRooms: number;
    roomPricePerDay: number;
    estimatedTotalPrice: number;
    numberOfDays: number;
  } | null>(null);
  const validateDates = (checkIn: string, checkOut: string) => {
    const currentDate = moment().format('YYYY-MM-DD');
    const checkInDate = moment(checkIn);
    const checkOutDate = moment(checkOut);
    
    return checkInDate.isSameOrAfter(currentDate) && 
           checkOutDate.isAfter(checkInDate);
  };
  const checkAvailability = async (updateData: Partial<Booking>) => {
    if (!updateData.room_type && !updateData.check_in_date && !updateData.check_out_date) return;
  
    try {
      const response = await axios.post(`${API_URLS.BACKEND_URL}/api/rooms/availability`, {
        roomType: updateData.room_type || booking?.room_type,
        checkInDate: updateData.check_in_date || booking?.check_in_date,
        checkInTime: updateData.check_in_time || booking?.check_in_time,
        checkOutDate: updateData.check_out_date || booking?.check_out_date,
        checkOutTime: updateData.check_out_time || booking?.check_out_time
      });
      setAvailability(response.data);
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  const isCheckInDay = booking ? 
    moment(booking.check_in_date).isSame(moment(), 'day') : false;

  const isApproachingCheckIn = booking ? 
    moment(booking.check_in_date).diff(moment(), 'days') <= 1 : false;
  
  const isCheckoutDay = booking ? 
    moment(booking.check_out_date).isSame(moment(), 'day') : false;  

    useEffect(() => {
      const checkRoomAvailability = async () => {
        if (!updatedBooking.room_type && !updatedBooking.check_in_date && !updatedBooking.check_out_date) {
          return;
        }
    
        if (updatedBooking.check_in_date && updatedBooking.check_out_date) {
          if (!validateDates(updatedBooking.check_in_date, updatedBooking.check_out_date)) {
            return;
          }
        }
    
        try {
          const response = await axios.post(`${API_URLS.BACKEND_URL}/api/rooms/availability`, {
            roomType: updatedBooking.room_type || booking?.room_type || '',
            checkInDate: updatedBooking.check_in_date || booking?.check_in_date || '',
            checkInTime: updatedBooking.check_in_time || booking?.check_in_time || '',
            checkOutDate: updatedBooking.check_out_date || booking?.check_out_date || '',
            checkOutTime: updatedBooking.check_out_time || booking?.check_out_time || ''
          });
          setAvailability(response.data);
        } catch (error) {
          console.error("Error checking availability:", error);
          setAvailability(null);
        }
      };
    
      checkRoomAvailability();
    }, [
      updatedBooking.room_type, 
      updatedBooking.check_in_date, 
      updatedBooking.check_out_date,
      booking?.room_type,
      booking?.check_in_date,
      booking?.check_out_date
    ]); 
    useEffect(() => {
      if (booking) {
        setUpdatedBooking({
          room_type: booking.room_type || '',
          check_in_date: booking.check_in_date || '',
          check_in_time: booking.check_in_time || '',
          check_out_date: booking.check_out_date || '',
          check_out_time: booking.check_out_time || '',
          guest_count: booking.guest_count || 1,
          notes: booking.notes || ''
        });
      }
    }, [booking]);  

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

  const handleSendCheckoutReminder = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URLS.BACKEND_URL}/api/admin/bookings/${resolvedParams.id}/checkout-notify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      await fetchBooking();
    } catch (err) {
      setError('Failed to send checkout reminder');
    }
  };

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(`${API_URLS.BACKEND_URL}/api/room-types`);
        setRoomTypes(response.data);
      } catch (error) {
        console.error('Failed to fetch room types:', error);
      }
    };
  
    fetchRoomTypes();
  }, []);
  const handleUpdateBooking = async () => {
    setIsUpdating(true);
    try {
      if (updatedBooking.check_in_date && updatedBooking.check_out_date) {
        if (!validateDates(updatedBooking.check_in_date, updatedBooking.check_out_date)) {
          setError('Invalid date range');
          return;
        }
      }
  
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
  
      const response = await axios.patch(
        `${API_URLS.BACKEND_URL}/api/admin/bookings/${resolvedParams.id}/update`,
        updatedBooking,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.message === 'Booking updated successfully') {
        await fetchBooking();
        setIsUpdateModalOpen(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update booking');
    } finally {
      setIsUpdating(false);
    }
  }

  // Add new handlers
    const handleCancelBooking = async () => {
        try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(
            `${API_URLS.BACKEND_URL}/api/admin/bookings/${resolvedParams.id}`,
            {
            headers: { Authorization: `Bearer ${token}` }
            }
        );
        router.push('/admin/bookings');
        } catch (err) {
        setError('Failed to cancel booking');
        }
    };

    

    // Update the Select component to prevent auto-closing
    <Select
    label="Room Type"
    selectedKeys={new Set([updatedBooking.room_type || ''])}
    onSelectionChange={(keys) => {
      const value = Array.from(keys)[0] as string;
      setUpdatedBooking(prev => ({
        ...prev,
        room_type: value
      }));
    }}
    disallowEmptySelection
    className="w-full"
  >
    {roomTypes.map((room) => (
      <SelectItem 
        key={room.type} 
        value={room.type}
        textValue={room.type}
      >
        {room.type} (${room.price}/night)
      </SelectItem>
    ))}
  </Select>

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
                    selectedKeys={[booking.paid_status]} // Change value to selectedKeys
                    onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleStatusUpdate({ paid_status: value });
                    }}
                    >
                    <SelectItem key="unpaid">Unpaid</SelectItem>
                    <SelectItem key="partially_paid">Partially Paid</SelectItem>
                    <SelectItem key="paid">Paid</SelectItem>
                </Select>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold">Check-in/out</h3>
              <p>Check-in: {booking.check_in_date} at {booking.check_in_time}</p>
              <p>Check-out: {booking.check_out_date} at {booking.check_out_time}</p>

                <div className="mt-4">
                <h3 className="font-semibold mb-2">Verification Status</h3>
                <Select
                  selectedKeys={[booking.verification_status]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    handleStatusUpdate({ verification_status: value as 'pending' | 'verified' | 'not_verified' });
                  }}
                  >
                  <SelectItem key="pending">Pending</SelectItem>
                  <SelectItem key="verified">Verified</SelectItem>
                  <SelectItem key="not_verified">Not Verified</SelectItem>
                </Select>
                </div>
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
          
          {booking.verification_status === 'verified' && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Check-in/out Management</h3>
              <div className="flex gap-2">
                <Button
                  color="success"
                  isDisabled={booking.checkin_status === 'checked_in'}
                  onPress={() => handleStatusUpdate({ checkin_status: 'checked_in' })}
                >
                  Check In
                </Button>
                <Button
                  color="warning"
                  isDisabled={booking.checkin_status !== 'checked_in' || booking.paid_status !== 'paid'}
                  onPress={() => handleStatusUpdate({ 
                    checkin_status: 'checked_out',
                    status: 'completed'
                  })}
                >
                  Check Out
                </Button>
              </div>
              <div className="mt-2">
                <Chip
                  color={
                    booking.checkin_status === 'checked_in' 
                      ? 'success' 
                      : booking.checkin_status === 'checked_out' 
                        ? 'warning' 
                        : 'default'
                  }
                >
                  {booking.checkin_status ? booking.checkin_status.replace('_', ' ').toUpperCase() : 'NOT CHECKED IN'}
                </Chip>
              </div>
            </div>
          )}

          {(isApproachingCheckIn || (isCheckoutDay && !booking.checkout_reminder_sent)) && (
            <div className="mt-4 flex gap-2">
              {isApproachingCheckIn && (
                <Button
                  color="warning"
                  onPress={handleSendReminder}
                >
                  Send Check-in Reminder
                </Button>
              )}
              {isCheckoutDay && !booking.checkout_reminder_sent && (
                <Button
                  color="warning"
                  onPress={handleSendCheckoutReminder}
                >
                  Send Checkout Reminder
                </Button>
              )}
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

        <Divider className="my-4" />
        <div className="flex justify-end gap-2">
        {booking.status === 'confirmed' && (
            <>
            <Button
                color="primary"
                variant="flat"
                onPress={() => setIsUpdateModalOpen(true)}
            >
                Update Booking
            </Button>
            <Button
                color="danger"
                variant="flat"
                onPress={() => setIsCancelModalOpen(true)}
            >
                Cancel Booking
            </Button>
            </>
        )}
        </div>

        </CardBody>
      </Card>
        <Modal 
          isOpen={isUpdateModalOpen} 
          onClose={() => setIsUpdateModalOpen(false)}
          isDismissable={false}
        >
          <ModalContent>
            <ModalHeader>Update Booking</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
              <Select
                label="Room Type"
                selectedKeys={[updatedBooking.room_type || booking?.room_type || '']}
                onChange={(e) => {
                  e.preventDefault(); // Prevent default form submission
                  setUpdatedBooking(prev => ({
                    ...prev,
                    room_type: e.target.value
                  }));
                }}
                className="w-full"
              >
                {roomTypes.map((room) => (
                  <SelectItem 
                    key={room.type}
                    value={room.type}
                  >
                    {room.type} (${room.price}/night)
                  </SelectItem>
                ))}
              </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Check-in Date"
                    value={updatedBooking.check_in_date || booking.check_in_date}
                    onChange={(e) => setUpdatedBooking({
                      ...updatedBooking,
                      check_in_date: e.target.value
                    })}
                  />
                  <Input
                    type="time"
                    label="Check-in Time"
                    value={updatedBooking.check_in_time || booking.check_in_time}
                    onChange={(e) => setUpdatedBooking({
                      ...updatedBooking,
                      check_in_time: e.target.value
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Check-out Date"
                    value={updatedBooking.check_out_date || booking.check_out_date}
                    onChange={(e) => setUpdatedBooking({
                      ...updatedBooking,
                      check_out_date: e.target.value
                    })}
                  />
                  <Input
                    type="time"
                    label="Check-out Time"
                    value={updatedBooking.check_out_time || booking.check_out_time}
                    onChange={(e) => setUpdatedBooking({
                      ...updatedBooking,
                      check_out_time: e.target.value
                    })}
                  />
                </div>

                <Input
                  type="number"
                  label="Number of Guests"
                  min={1}
                  max={4}
                  value={(updatedBooking.guest_count || booking.guest_count).toString()}
                  onChange={(e) => setUpdatedBooking({
                    ...updatedBooking,
                    guest_count: parseInt(e.target.value)
                  })}
                />

                <Input
                  label="Notes"
                  value={updatedBooking.notes || booking.notes}
                  onChange={(e) => setUpdatedBooking({
                    ...updatedBooking,
                    notes: e.target.value
                  })}
                  placeholder="Any special requests?"
                />

                {/* Add availability check info here */}
                {availability && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Chip 
                        color={availability.available ? "success" : "danger"}
                        size="sm"
                      >
                        {availability.available 
                          ? `${availability.remainingRooms} Rooms Available`
                          : "Fully Booked"
                        }
                      </Chip>
                      {availability.available && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            ${availability.roomPricePerDay}/night • {availability.numberOfDays} nights
                          </p>
                          <p className="text-base font-semibold text-success">
                            Total: ${availability.estimatedTotalPrice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="default" 
              onPress={() => setIsUpdateModalOpen(false)}
              isDisabled={isUpdating}
              >
                Close
              </Button>
              <Button 
                color="primary" 
                onPress={handleUpdateBooking}
                isDisabled={!availability?.available || isUpdating}
                isLoading={isUpdating}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        <Modal 
        isOpen={isCancelModalOpen} 
        onClose={() => setIsCancelModalOpen(false)}
        >
        <ModalContent>
            <ModalHeader>Confirm Cancellation</ModalHeader>
            <ModalBody>
            Are you sure you want to cancel this booking? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
            <Button color="default" onPress={() => setIsCancelModalOpen(false)}>
                Close
            </Button>
            <Button color="danger" onPress={handleCancelBooking}>
                Cancel Booking
            </Button>
            </ModalFooter>
        </ModalContent>
        </Modal>
    </div>
  );
}