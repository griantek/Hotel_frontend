"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  Input,
  Select,
  SelectItem,
  Button,
  Card,
  CardBody,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip
} from "@nextui-org/react";
import { API_URLS } from "@/utils/constants";
interface RoomType {
  type: string;
  price: number;
}

interface FormData {
  name: string;
  phone: string;
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  guestCount: number;
  notes?: string;
}
interface BookingResponse {
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

interface RoomAvailability {
  available: boolean;
  remainingRooms: number;
  roomPricePerDay: number;
  estimatedTotalPrice: number;
  numberOfDays: number;
}

export default function ModifyBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

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

  // Add validation effect
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        router.push("/tokenexp"); // Redirect if no token
        return;
      }

      try {
        const response = await axios.get(`${API_URLS.BACKEND_URL}/validate-token`, {
          params: { token }
        });
        
        // After token validation, fetch booking using the ID from token data
        setBookingId(response.data.id);
      } catch (error) {
        console.error('Token validation failed:', error);
        router.push("/tokenexp"); // Redirect on invalid token
      }
    };

    validateToken();
  }, [token, router]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    roomType: "",
    checkInDate: "",
    checkInTime: "12:00",
    checkOutDate: "",
    checkOutTime: "11:00",
    guestCount: 1,
    notes: ""
  });

  const [availability, setAvailability] = useState<RoomAvailability | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axios.get<BookingResponse>(`${API_URLS.BACKEND_URL}/api/bookings/${bookingId}`);
        const booking = response.data;
        console.log('Room type from API:', booking.room_type); // Debug log
        
        setFormData(prev => ({
          ...prev,
          name: booking.guest_name,
          phone: booking.guest_phone,
          roomType: booking.room_type,
          checkInDate: booking.check_in_date,
          checkInTime: booking.check_in_time,
          checkOutDate: booking.check_out_date,
          checkOutTime: booking.check_out_time,
          guestCount: booking.guest_count,
          notes: booking.notes || ""
        }));
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
    };
    

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const checkAvailability = async () => {
    if (!formData.roomType || !formData.checkInDate || !formData.checkOutDate) return;

    try {
      const response = await axios.post(`${API_URLS.BACKEND_URL}/api/rooms/availability`, {
        roomType: formData.roomType,
        checkInDate: formData.checkInDate,
        checkInTime: formData.checkInTime,
        checkOutDate: formData.checkOutDate,
        checkOutTime: formData.checkOutTime
      });
      setAvailability(response.data);
    } catch (error) {
      console.error("Error checking availability:", error);
    }
  };

  useEffect(() => {
    if (formData.roomType && formData.checkInDate && formData.checkOutDate) {
      checkAvailability();
    }
  }, [formData.roomType, formData.checkInDate, formData.checkOutDate]);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    const currentDate = new Date().toISOString().split('T')[0];

    if (!formData.roomType) newErrors.roomType = "Room type is required";
    if (!formData.checkInDate) newErrors.checkInDate = "Check-in date is required";
    if (!formData.checkOutDate) newErrors.checkOutDate = "Check-out date is required";
    if (formData.checkInDate < currentDate) newErrors.checkInDate = "Check-in date cannot be in the past";
    if (formData.checkOutDate <= formData.checkInDate) {
      newErrors.checkOutDate = "Check-out date must be after check-in date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !availability?.available) return;
  
    setIsLoading(true);
    try {
      const response = await axios.patch(`${API_URLS.BACKEND_URL}/api/bookings/${bookingId}`, {
        roomType: formData.roomType,
        checkInDate: formData.checkInDate,
        checkInTime: formData.checkInTime,
        checkOutDate: formData.checkOutDate,
        checkOutTime: formData.checkOutTime,
        guestCount: formData.guestCount,
        notes: formData.notes
      });
  
      if (response.data.message === 'Booking modified successfully') {
        setIsSuccess(true);
        setTimeout(() => {
          router.push(`/confirmation?id=${bookingId}`);;
        }, 0);
      }
    } catch (error) {
      console.error("Error modifying booking:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardBody>
          <h1 className="text-2xl font-bold mb-6 text-center">Modify Booking</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
          
          <Select
            label="Room Type"
            defaultSelectedKeys={[formData.roomType]}
            selectedKeys={[formData.roomType]}
            onChange={(e) => {
              handleChange({
                target: {
                  name: 'roomType',
                  value: e.target.value
                }
              });
            }}
            isRequired
          >
            {roomTypes.map((room) => (
              <SelectItem 
                key={room.type} 
                value={room.type}
              >
                {room.type}
              </SelectItem>
            ))}
          </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  label="Check-in Date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  errorMessage={errors.checkInDate}
                  isRequired
                />
              </div>
              <div>
                <Input
                  type="time"
                  label="Check-in Time"
                  name="checkInTime"
                  value={formData.checkInTime}
                  onChange={handleChange}
                  isRequired
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  label="Check-out Date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  errorMessage={errors.checkOutDate}
                  isRequired
                />
              </div>
              <div>
                <Input
                  type="time"
                  label="Check-out Time"
                  name="checkOutTime"
                  value={formData.checkOutTime}
                  onChange={handleChange}
                  isRequired
                />
              </div>
            </div>

            <Input
              type="number"
              label="Number of Guests"
              name="guestCount"
              value={formData.guestCount.toString()}
              onChange={handleChange}
              min={1}
              max={4}
              isRequired
            />

            <Input
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requests?"
            />

              {availability && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Chip 
                      color={availability.available ? "success" : "danger"}
                      size="sm"
                      className="font-medium"
                    >
                      {availability.available 
                        ? `${availability.remainingRooms} ${availability.remainingRooms === 1 ? 'Room' : 'Rooms'} Available`
                        : "Fully Booked"}
                    </Chip>
                    
                    {availability.available && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          ${availability.roomPricePerDay.toFixed(2)}/night • {availability.numberOfDays} {availability.numberOfDays === 1 ? 'night' : 'nights'}
                        </p>
                        <p className="text-base font-semibold text-success">
                          Total: ${availability.estimatedTotalPrice.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              isDisabled={!availability?.available}
              className="w-full"
            >
              Update Booking
            </Button>
          </form>
        </CardBody>
      </Card>

    </div>
  );
}