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
  const [errors, setErrors] = useState<Partial<FormData>>({});
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  
    // Dynamic validation for the field being updated
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
  
      // Validate specific fields
      if (field === "name" && typeof value === 'string' && !value.trim()) {
        newErrors.name = "Name is required";
      } else if (field === "roomType" && !value) {
        newErrors.roomType = "Room type is required";
      } else if (field === "checkInDate") {
        const currentDate = new Date().toISOString().split("T")[0];
        if (!value) {
          newErrors.checkInDate = "Check-in date is required";
        } else if (value < currentDate) {
          newErrors.checkInDate = "Check-in date cannot be in the past";
        } else {
          delete newErrors.checkInDate; // Clear error if valid
        }
      } else if (field === "checkOutDate") {
        if (!value) {
          newErrors.checkOutDate = "Check-out date is required";
        } else if (value <= formData.checkInDate) {
          newErrors.checkOutDate = "Check-out date must be after check-in date";
        } else {
          delete newErrors.checkOutDate; // Clear error if valid
        }
      } else {
        delete newErrors[field]; // Clear error for valid input
      }
  
      return newErrors;
    });
  };
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    const currentDate = new Date().toISOString().split("T")[0];
  
    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
  
    // Validate Room Type
    if (!formData.roomType) {
      newErrors.roomType = "Room type is required";
    }
  
    // Validate Check-in Date
    if (!formData.checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    } else if (formData.checkInDate < currentDate) {
      newErrors.checkInDate = "Check-in date cannot be in the past";
    }
  
    // Validate Check-out Date
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required";
    } else if (formData.checkOutDate <= formData.checkInDate) {
      newErrors.checkOutDate = "Check-out date must be after check-in date";
    }
  
    setErrors(newErrors); // Update all errors in state
  
    // Return true if no errors exist
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
    setErrors({}); // Reset errors on submission attempt
  
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }
  
    setIsLoading(true);
    setMessage("");
  
    try {
      const response = await axios.post(`${API_URLS.BACKEND_URL}/api/bookings`, formData);
      if (response.data) {
        setMessage("Booking successful!");
        router.push(`/confirmation?id=${response.data.bookingId}`);
      }
    } catch (error) {
      setMessage("Failed to create booking. Please try again.");
      console.error("Booking failed:", error);
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
              isInvalid={!!errors.name}
              errorMessage={errors.name}
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
              isInvalid={!!errors.roomType}
              errorMessage={errors.roomType}
              isRequired
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
                isInvalid={!!errors.checkInDate}
                errorMessage={errors.checkInDate}
                isRequired
              />
              <Input
                type="time"
                label="Check-in Time"
                value={formData.checkInTime}
                onChange={(e) => handleInputChange("checkInTime", e.target.value)}
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
                isInvalid={!!errors.checkOutDate}
                errorMessage={errors.checkOutDate}
                isRequired
              />
              <Input
                type="time"
                label="Check-out Time"
                value={formData.checkOutTime}
                onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
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