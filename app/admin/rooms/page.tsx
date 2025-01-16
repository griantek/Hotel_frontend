'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip
} from "@nextui-org/react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { API_URLS } from "@/utils/constants";

interface Room {
  id: number;
  type: string;
  price: number;
  availability: number;
}

interface RoomForm {
  type: string;
  price: number;
  availability: number;
}

export default function RoomsPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomForm>({
    type: '',
    price: 0,
    availability: 0
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(`${API_URLS.BACKEND_URL}/admin/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch rooms');
      if (error.response?.status === 401) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (editingRoom) {
        await axios.patch(
          `${API_URLS.BACKEND_URL}/admin/rooms/${editingRoom.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URLS.BACKEND_URL}/admin/rooms`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchRooms();
      onClose();
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      type: room.type,
      price: room.price,
      availability: room.availability
    });
    onOpen();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room type?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URLS.BACKEND_URL}/admin/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete room');
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({ type: '', price: 0, availability: 0 });
  };

  const filteredRooms = rooms.filter(room =>
    room.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Room Management</h1>

      <Card className="mb-6">
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <div className="w-1/3">
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button color="primary" onPress={() => { resetForm(); onOpen(); }}>
              Add New Room Type
            </Button>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-white bg-danger-400 rounded">
              {error}
            </div>
          )}

          <Table aria-label="Rooms table">
            <TableHeader>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>AVAILABILITY</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>${room.price}</TableCell>
                  <TableCell>
                    <Chip
                      color={room.availability > 0 ? "success" : "danger"}
                      size="sm"
                    >
                      {room.availability} rooms
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleEdit(room)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => handleDelete(room.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {editingRoom ? 'Edit Room Type' : 'Add New Room Type'}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Room Type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                />
                <Input
                  type="number"
                  label="Price per Night"
                  value={formData.price.toString()}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  required
                />
                <Input
                  type="number"
                  label="Available Rooms"
                  value={formData.availability.toString()}
                  onChange={(e) => setFormData({...formData, availability: Number(e.target.value)})}
                  required
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                {editingRoom ? 'Update' : 'Add'} Room
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}