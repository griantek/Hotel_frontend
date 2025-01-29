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
  Chip,
  useDisclosure,
} from "@nextui-org/react";
import { API_URLS } from "@/utils/constants";

interface RoomPhoto {
  id: number;
  photo_url: string;
  is_primary: boolean;
}

interface RoomType {
  type: string;
  price: number;
  photos: RoomPhoto[];
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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

  // Add click handler
  const handlePhotoClick = (photoUrl: string) => {
    setSelectedPhoto(`${API_URLS.BACKEND_URL}${photoUrl}`);
    onOpen();
  };

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
  const handleRoomTypeChange = (value: string) => {
    handleChange({
      target: {
        name: 'roomType',
        value
      }
    });
    const selected = roomTypes.find(r => r.type === value) || null;
    setSelectedRoom(selected);
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
            onChange={(e) => handleRoomTypeChange(e.target.value)}
            isRequired
          >
            {roomTypes.map((room) => (
              <SelectItem key={room.type} value={room.type}>
                {room.type}
              </SelectItem>
            ))}
          </Select>
          {selectedRoom && selectedRoom.photos && selectedRoom.photos.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-3 gap-4">
                {selectedRoom.photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="relative aspect-video cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handlePhotoClick(photo.photo_url)}
                  >
                    {!imageErrors[photo.id] && (
                      <img
                        src={`${API_URLS.BACKEND_URL}${photo.photo_url}`}
                        alt={selectedRoom.type}
                        className="rounded-lg object-cover w-full h-full"
                        onError={() => {
                          setImageErrors(prev => ({
                            ...prev,
                            [photo.id]: true
                          }));
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Room Price: ${selectedRoom.price}/night
              </p>
            </div>
          )}
          <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="5xl"
          >
            <ModalContent>
              <ModalBody className="p-0">
                {selectedPhoto && (
                  <div className="relative aspect-video">
                    <img
                      src={selectedPhoto}
                      alt="Enlarged room view"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>

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