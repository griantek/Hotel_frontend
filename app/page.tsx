'use client';

import { Button, Card, CardBody } from "@nextui-org/react";
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://img.freepik.com/free-photo/sunset-coming-through-windows-hotel_181624-292.jpg?t=st=1737053355~exp=1737056955~hmac=0a50bbb36d13d686f150dc223afb5054a0dbf18d44cdeb1711b5297a6f3d206f&w=1480')`,
      }}
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Welcome to Luxury Hotel
          </h1>
          <p className="text-xl mb-8 text-gray-200">
            Experience comfort and luxury at its finest
          </p>
          <Button 
            color="primary" 
            size="lg"
            onPress={() => router.push('/admin/login')}
            className="font-semibold"
          >
            Admin Login
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          <Card className="bg-content1/80 backdrop-blur-md">
            <CardBody className="text-center p-6">
              <h3 className="text-xl font-bold mb-3 text-foreground">Luxurious Rooms</h3>
              <p className="text-foreground-500">
                Elegantly furnished rooms with modern amenities
              </p>
            </CardBody>
          </Card>

          <Card className="bg-content1/80 backdrop-blur-md">
            <CardBody className="text-center p-6">
              <h3 className="text-xl font-bold mb-3 text-foreground">Fine Dining</h3>
              <p className="text-foreground-500">
                Experience world-class cuisine at our restaurants
              </p>
            </CardBody>
          </Card>

          <Card className="bg-content1/80 backdrop-blur-md">
            <CardBody className="text-center p-6">
              <h3 className="text-xl font-bold mb-3 text-foreground">Premium Service</h3>
              <p className="text-foreground-500">
                24/7 concierge and personalized attention
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Contact Section */}
        <Card className="mt-12 bg-content1/80 backdrop-blur-md">
          <CardBody className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Contact Us</h2>
            <p className="text-foreground-500 mb-2">123 Luxury Avenue, City</p>
            <p className="text-foreground-500 mb-2">Phone: +1 234 567 8900</p>
            <p className="text-foreground-500">Email: info@luxuryhotel.com</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}