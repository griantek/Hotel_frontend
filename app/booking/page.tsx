"use client";

import { useState, useEffect , Suspense} from "react";
import {
  Card,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Chip,
  Divider,
  Skeleton,
} from "@nextui-org/react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URLS } from "@/utils/constants";
import ErrorNotification from "@/components/ErrorNotification";

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

function BookingContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [availability, setAvailability] = useState<Availability | null>(null);
  const searchParams = useSearchParams();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const token = searchParams.get("token");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [tokenError, setTokenError] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    roomType: "",
    checkInDate: "",
    checkInTime: "14:00",
    checkOutDate: "",
    checkOutTime: "11:00",
    guestCount: 1,
    notes: "",
  });

  useEffect(() => {
    const validateToken = async () => {
      setIsLoading(true);
      setTokenError('');
      
      if (!token) {
        router.push("/tokenexp");
        return;
      }
  
      let retryCount = 0;
      const maxRetries = 3;
  
      while (retryCount < maxRetries) {
        try {
          const response = await axios.get(
            `${API_URLS.BACKEND_URL}/validate-token`,
            {
              params: { token },
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              },
              timeout: 5000 // 5 second timeout
            }
          );
  
          if (response.data) {
            setFormData((prev) => ({
              ...prev,
              name: response.data.name,
              phone: response.data.phone,
            }));
            setIsLoading(false);
            return;
          }
  
        } catch (error: any) {
          retryCount++;
          
          if (retryCount === maxRetries) {
            let errorMessage = 'Token validation failed';
            
            if (axios.isAxiosError(error)) {
              if (error.response) {
                errorMessage = `Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
              } else if (error.request) {
                errorMessage = 'No response from server';
              } else {
                errorMessage = `Request error: ${error.message}`;
              }
            }
  
            console.error("Token validation failed:", {
              error: errorMessage,
              details: error
            });
            
            setTokenError(errorMessage);
            setIsLoading(false);
            router.push(`/tokenexp?error=${encodeURIComponent(errorMessage)}`);
            return;
          }
  
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    };
  
    validateToken();
  }, [token, router]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(
          `${API_URLS.BACKEND_URL}/api/room-types`
        );
        setRoomTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch room types:", error);
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

  const calculateMinCheckoutDateTime = (checkInDate: string, checkInTime: string): { date: string; time: string } => {
    const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
    const minCheckoutDateTime = new Date(checkInDateTime.getTime() + (12 * 60 * 60 * 1000)); // Add 12 hours
    
    return {
      date: minCheckoutDateTime.toISOString().split('T')[0],
      time: minCheckoutDateTime.toTimeString().slice(0, 5)
    };
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset check-in time if date changes
      if (field === "checkInDate") {
        newData.checkInTime = "14:00";
        // Reset checkout date and time if new check-in date is after current checkout date
        if (
          newData.checkOutDate &&
          newData.checkOutDate < newData.checkInDate
        ) {
          newData.checkOutDate = newData.checkInDate;
          newData.checkOutTime = "11:00";
        }
      }

      // For same day booking, ensure checkout time is after check-in time
      if (newData.checkInDate === newData.checkOutDate) {
        if (field === "checkInTime" && newData.checkOutTime <= value) {
          newData.checkOutTime = addHours(value as string, 1);
        }
      }

      // Update checkout date and time when check-in changes
      if (field === 'checkInDate' || field === 'checkInTime') {
        if (newData.checkInDate && newData.checkInTime) {
          const minCheckout = calculateMinCheckoutDateTime(newData.checkInDate, newData.checkInTime);
          newData.checkOutDate = minCheckout.date;
          newData.checkOutTime = minCheckout.time;
        }
      }

      return newData;
    });
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  // Helper function to add hours to time string
  const addHours = (time: string, hoursToAdd: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const newHours = (hours + hoursToAdd) % 24;
    return `${newHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const getDateTimeFromStrings = (date: string, time: string): Date => {
    return new Date(`${date}T${time}`);
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const currentDate = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Room type validation
    if (!formData.roomType) {
      console.log("Room type validation failed");
      newErrors.roomType = "Room type is required";
    }

    // Check-in datetime validation
    if (!formData.checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    } else {
      const checkInDateTime = getDateTimeFromStrings(
        formData.checkInDate,
        formData.checkInTime
      );
      if (checkInDateTime < now) {
        newErrors.checkInTime = "Check-in date and time cannot be in the past";
      }
    }

    // Check-out datetime validation
    if (!formData.checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required";
    } else {
      const checkInDateTime = getDateTimeFromStrings(
        formData.checkInDate,
        formData.checkInTime
      );
      const checkOutDateTime = getDateTimeFromStrings(
        formData.checkOutDate,
        formData.checkOutTime
      );

      const minCheckOutDateTime = new Date(checkInDateTime.getTime() + (12 * 60 * 60 * 1000));
      
      if (checkOutDateTime < minCheckOutDateTime) {
        newErrors.checkOutTime = "Minimum stay duration is 12 hours";
      }

      // Same day booking validation
      if (formData.checkInDate === formData.checkOutDate) {
        if (formData.checkOutTime <= formData.checkInTime) {
          newErrors.checkOutTime =
            "Check-out time must be after check-in time on same day";
        }
      } else if (checkOutDateTime <= checkInDateTime) {
        newErrors.checkOutDate =
          "Check-out date and time must be after check-in date and time";
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
    console.log("Set Errors:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.roomType && formData.checkInDate && formData.checkOutDate) {
        try {
          const response = await axios.post(
            `${API_URLS.BACKEND_URL}/api/rooms/availability`,
            {
              roomType: formData.roomType,
              checkInDate: formData.checkInDate,
              checkInTime: formData.checkInTime,
              checkOutDate: formData.checkOutDate,
              checkOutTime: formData.checkOutTime,
            }
          );
          setAvailability(response.data);
        } catch (error) {
          console.error("Failed to check availability:", error);
        }
      }
    };

    checkAvailability();
  }, [formData.roomType, formData.checkInDate, formData.checkOutDate]);

  useEffect(() => {
    console.log("Current Errors:", errors);
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

  console.log('SUBMIT TRIGGERED');
  console.log('Form Data BEFORE Validation:', formData);

  const isValid = validateForm();
  
  console.log('Validation Result:', isValid);
  console.log('Errors After Validation:', JSON.stringify(errors));

  if (!isValid) {
    setShowErrorModal(true);
    return;
  }

    if (!availability?.available) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URLS.BACKEND_URL}/api/bookings`,
        formData
      );
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
    <div className="max-w-4xl mx-auto p-6">
      <ErrorNotification 
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={errors}
      />
      
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
              isRequired
              onBlur={() => {
                if (!formData.roomType) {
                  setErrors((prev) => ({
                    ...prev,
                    roomType: "Room type is required",
                  }));
                }
              }}
              onSelectionChange={(keys) => {
                const selectedValue = Array.from(keys)[0] as string;
                handleInputChange("roomType", selectedValue);

                // Clear room type error when a selection is made
                setErrors((prev) => ({
                  ...prev,
                  roomType: undefined,
                }));
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
                min={new Date().toISOString().split("T")[0]}
                label="Check-in Date"
                value={formData.checkInDate}
                onChange={(e) =>
                  handleInputChange("checkInDate", e.target.value)
                }
                isRequired
              />
              <Input
                type="time"
                label="Check-in Time"
                value={formData.checkInTime}
                onChange={(e) =>
                  handleInputChange("checkInTime", e.target.value)
                }
                isDisabled={!formData.checkInDate}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                min={
                  formData.checkInDate || new Date().toISOString().split("T")[0]
                }
                label="Check-out Date"
                value={formData.checkOutDate}
                onChange={(e) =>
                  handleInputChange("checkOutDate", e.target.value)
                }
                isDisabled={!formData.checkInDate}
                isRequired
              />
              <Input
                type="time"
                label="Check-out Time"
                value={formData.checkOutTime}
                onChange={(e) =>
                  handleInputChange("checkOutTime", e.target.value)
                }
                isDisabled={!formData.checkOutDate}
                required
              />
            </div>

            <Input
              type="number"
              label="Number of Guests"
              min="1"
              value={formData.guestCount.toString()}
              onChange={(e) =>
                handleInputChange("guestCount", parseInt(e.target.value))
              }
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
                      ? `${availability.remainingRooms} ${availability.remainingRooms === 1 ? "Room" : "Rooms"} Available`
                      : "Fully Booked"}
                  </Chip>

                  {availability.available && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ${availability.roomPricePerDay.toFixed(2)}/night •{" "}
                        {availability.numberOfDays}{" "}
                        {availability.numberOfDays === 1 ? "night" : "nights"}
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

export default function BookingPage() {
  return (
    <Suspense 
      fallback={
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
      }
    >
      <BookingContent />
    </Suspense>
  );
}
