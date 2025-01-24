'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Input, Button, Select, SelectItem, Chip, Divider, Skeleton } from "@nextui-org/react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
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
  notes: string;
}

interface Availability {
  available: boolean;
  remainingRooms: number;
  roomPricePerDay: number;
  estimatedTotalPrice: number;
  numberOfDays: number;
}

export default function BookingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [availability, setAvailability] = useState<Availability | null>(null);
  const searchParams = useSearchParams();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const token = searchParams.get('token');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    roomType: '',
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '11:00',
    guestCount: 1,
    notes: ''
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        router.push("/tokenexp"); // Redirect to home if no token
        return;
      }

      try {
        const response = await axios.get(`${API_URLS.BACKEND_URL}/validate-token`, {
          params: { token }
        });

        // Update form with validated user data
        setFormData(prev => ({
          ...prev,
          name: response.data.name,
          phone: response.data.phone
        }));

        setIsLoading(false);
      } catch (error) {
        console.error('Token validation failed:', error);
        router.push("/tokenexp"); // Redirect to home on invalid token
      }
    };

    validateToken();
  }, [token, router]);
  
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

  const isTimeValid = (date: string, time: string): boolean => {
    if (!date) return true;
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);
    return selectedDateTime > now;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Reset check-in time if date changes
      if (field === 'checkInDate') {
        newData.checkInTime = '14:00';
        // Reset checkout date and time if new check-in date is after current checkout date
        if (newData.checkOutDate && newData.checkOutDate < newData.checkInDate) {
          newData.checkOutDate = newData.checkInDate;
          newData.checkOutTime = '11:00';
        }
      }
      
      // For same day booking, ensure checkout time is after check-in time
      if (newData.checkInDate === newData.checkOutDate) {
        if (field === 'checkInTime' && newData.checkOutTime <= value) {
          newData.checkOutTime = addHours(value as string, 1);
        }
      }

      return newData;
    });
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  // Helper function to add hours to time string
  const addHours = (time: string, hoursToAdd: number): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + hoursToAdd) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getDateTimeFromStrings = (date: string, time: string): Date => {
    return new Date(`${date}T${time}`);
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const currentDate = new Date().toISOString().split('T')[0];
    const now = new Date();
  
    // Room type validation
    if (!formData.roomType) {
      newErrors.roomType = "Room type is required";
    }
  
    // Check-in datetime validation
    if (!formData.checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    } else {
      const checkInDateTime = getDateTimeFromStrings(formData.checkInDate, formData.checkInTime);
      if (checkInDateTime < now) {
        newErrors.checkInTime = "Check-in date and time cannot be in the past";
      }
    }
  
    // Check-out datetime validation
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required";
    } else {
      const checkInDateTime = getDateTimeFromStrings(formData.checkInDate, formData.checkInTime);
      const checkOutDateTime = getDateTimeFromStrings(formData.checkOutDate, formData.checkOutTime);
      
      // Same day booking validation
      if (formData.checkInDate === formData.checkOutDate) {
        if (formData.checkOutTime <= formData.checkInTime) {
          newErrors.checkOutTime = "Check-out time must be after check-in time on same day";
        }
      } else if (checkOutDateTime <= checkInDateTime) {
        newErrors.checkOutDate = "Check-out date and time must be after check-in date and time";
      }
    }
  
    // Guest count validation
    if (!formData.guestCount || formData.guestCount < 1) {
      newErrors.guestCount = "At least 1 guest is required";
    }
  
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.roomType && formData.checkInDate && formData.checkOutDate) {
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
          console.error('Failed to check availability:', error);
        }
      }
    };

    checkAvailability();
  }, [formData.roomType, formData.checkInDate, formData.checkOutDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run validation before proceeding
    const isValid = validateForm();
    if (!isValid) {
      // If validation fails, return early
      return;
    }
    
    if (!availability?.available) {
      return;
    }
  
    setIsLoading(true);
    setMessage('');
  
    try {
      const response = await axios.post(`${API_URLS.BACKEND_URL}/api/bookings`, formData);
      if (response.data) {
        setMessage('Booking successful!');
        router.push(`/confirmation?id=${response.data.bookingId}`);
      }
    } catch (error) {
      setMessage('Failed to create booking. Please try again.');
      console.error('Booking failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardBody>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Book your room</h1>
      {message && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
          {message}
        </div>
      )}
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              isRequired
            />

            <input
                type="hidden"
                name="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />

            <Select
              label="Room Type"
              placeholder="Select room type"
              value={formData.roomType}
              onChange={(e) => handleInputChange("roomType", e.target.value)}
              errorMessage={errors.roomType}
              isInvalid={!!errors.roomType} 
              isRequired
              onBlur={() => {
                if (!formData.roomType) {
                  setErrors(prev => ({
                    ...prev,
                    roomType: "Room type is required"
                  }));
                }
              }}
            >
              {roomTypes.map((type) => (
                <SelectItem key={type.type} value={type.type}>
                  {`${type.type}`}
                </SelectItem>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                label="Check-in Date"
                value={formData.checkInDate}
                onChange={(e) => handleInputChange("checkInDate", e.target.value)}
                errorMessage={errors.checkInDate}
                isInvalid={!!errors.checkInDate}
                isRequired
              />
              <Input
                type="time"
                label="Check-in Time"
                value={formData.checkInTime}
                onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                isDisabled={!formData.checkInDate}
                errorMessage={!isTimeValid(formData.checkInDate, formData.checkInTime) ? "Selected time has already passed" : ""}
                isInvalid={!isTimeValid(formData.checkInDate, formData.checkInTime)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                min={formData.checkInDate || new Date().toISOString().split('T')[0] }
                label="Check-out Date"
                value={formData.checkOutDate}
                onChange={(e) => handleInputChange("checkOutDate", e.target.value)}
                errorMessage={errors.roomType}
                isInvalid={!!errors.checkOutDate} 
                isDisabled={!formData.checkInDate}
                isRequired
              />
              <Input
                type="time"
                label="Check-out Time"
                value={formData.checkOutTime}
                onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                isDisabled={!formData.checkOutDate}
                errorMessage={errors.checkOutTime}
                isInvalid={!!errors.checkOutTime}
                required
              />
            </div>

            <Input
              type="number"
              label="Number of Guests"
              min="1"
              value={formData.guestCount.toString()}
              onChange={(e) => handleInputChange("guestCount", parseInt(e.target.value))}
              required
            />

            <Input
              label="Notes (Optional)"
              placeholder="Any special requests?"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
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
              disabled={!availability?.available}
              className="w-full"
            >
              Book Now
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}