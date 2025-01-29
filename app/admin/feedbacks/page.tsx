'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Input,
  Chip,
} from "@nextui-org/react";
import { API_URLS } from "@/utils/constants";
import { Star, Search } from "lucide-react";

interface Feedback {
  id: number;
  booking_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  phone: string;
}

export default function FeedbacksPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(
        `${API_URLS.BACKEND_URL}/admin/feedback`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbacks(response.data);
    } catch (err) {
      setError('Failed to fetch feedbacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Guest Feedbacks</h1>
            <div className="w-1/3">
              <Input
                placeholder="Search feedbacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search className="text-default-400" />}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-white bg-danger-400 rounded">
              {error}
            </div>
          )}

          <Table aria-label="Feedbacks table">
            <TableHeader>
              <TableColumn>GUEST NAME</TableColumn>
              <TableColumn>PHONE</TableColumn>
              <TableColumn>RATING</TableColumn>
              <TableColumn>COMMENT</TableColumn>
              <TableColumn>DATE</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.user_name}</TableCell>
                  <TableCell>{feedback.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {renderStars(feedback.rating)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">
                      {feedback.comment || 'No comment'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}