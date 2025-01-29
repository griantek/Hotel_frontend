"use client";
import React, { useState, useEffect, Suspense } from "react";
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


function ModifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [tokenError, setTokenError] = useState<string>("");

  useEffect(() => {
    const fetchRoomTypes = async () => {
      setIsLoading(true); // Set loading state to true before fetching
      try {
        const response = await axios.get(`${API_URLS.BACKEND_URL}/api/room-types`);
        setRoomTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch room types:", error);
      } finally {
        setIsLoading(false); // Set loading state to false after fetching
      }
    };
  
    fetchRoomTypes();
  }, []);

  // Add validation effect
  useEffect(() => {
    const validateToken = async () => {
      setTokenError(''); // Reset error on new validation attempt
      
      if (!token) {
        setTokenError('No token provided');
        console.log('Token validation failed: No token provided');
        router.push("/tokenexp");
        return;
      }

      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Log the request details
      console.log('Token Validation Request:', {
        endpoint: `${API_URLS.BACKEND_URL}/validate-token`,
        method: 'GET',
        headers: requestConfig.headers,
        token: `${token.substring(0, 10)}...` // Show first 10 chars for debugging
      });
  
      try {
        const response = await axios.get(
          `${API_URLS.BACKEND_URL}/validate-token`, 
          requestConfig
        );
  
        // Log the response
        console.log('Token Validation Response:', {
          status: response.status,
          data: response.data
        });
  
        if (!response.data || !response.data.name || !response.data.phone) {
          throw new Error('Invalid response format from server');
        }

        // After token validation, fetch booking using the ID from token data
        setBookingId(response.data.id);
        setFormData(prev => ({
          ...prev,
          name: response.data.name,
          phone: response.data.phone,
        }));
  
        setIsLoading(false);
      } catch (error: any) {
        let errorMessage = 'Token validation failed';
        
        if (axios.isAxiosError(error)) {
          if (error.response) {
            errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
          } else if (error.request) {
            errorMessage = 'No response from server';
          } else {
            errorMessage = `Request error: ${error.message}`;
          }
        } else {
          errorMessage = error.message || 'Unknown error occurred';
        }

        console.error("Token validation failed:", {
          error: errorMessage,
          details: error
        });
        
        setTokenError(errorMessage);
        router.push(`/tokenexp?error=${encodeURIComponent(errorMessage)}`);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true); // Set loading state to true before fetching
      try {
        const response = await axios.get<BookingResponse>(`${API_URLS.BACKEND_URL}/api/bookings/${bookingId}`);
        const booking = response.data;
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
        console.error("Error fetching booking:", error);
      } finally {
        setIsLoading(false); // Set loading state to false after fetching
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
  if (isLoading) {
    // Show skeleton while loading
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardBody>
            <Skeleton className="h-12 w-full rounded-lg mb-4" />
            <Skeleton className="h-12 w-full rounded-lg mb-4" />
            <Skeleton className="h-12 w-full rounded-lg mb-4" />
            <Skeleton className="h-12 w-full rounded-lg mb-4" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardBody>
            <div className="text-red-500">
              <h2 className="text-lg font-bold">Authentication Error</h2>
              <p>{tokenError}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

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
                  min={new Date().toISOString().split('T')[0]}
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
                  min={ formData.checkInDate || new Date().toISOString().split('T')[0]}
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

export default function ModifyBooking() {
  return (
    <Suspense 
      fallback={
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardBody>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardBody>
          </Card>
        </div>
      }
    >
      <ModifyContent />
    </Suspense>
  );
  
}