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
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Image
} from "@nextui-org/react";
import { API_URLS } from "@/utils/constants";

interface RoomPhoto {
  id: number;
  photo_url: string;
  is_primary: boolean;
}

interface Room {
  id: number;
  type: string;
  price: number;
  availability: number;
  photos: RoomPhoto[];
}

interface RoomForm {
  type: string;
  price: number;
  availability: number;
  photos: File[];
}

export default function RoomsPage() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomForm>({
    type: '',
    price: 0,
    availability: 0,
    photos: []
  });

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(
        `${API_URLS.BACKEND_URL}/admin/rooms`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setRooms(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();
      
      formDataToSend.append('type', formData.type);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('availability', formData.availability.toString());
      
      selectedFiles.forEach(file => {
        formDataToSend.append('photos', file);
      });

      if (editingRoom) {
        await axios.patch(
          `${API_URLS.BACKEND_URL}/admin/rooms/${editingRoom.id}`,
          formDataToSend,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
      } else {
        await axios.post(
          `${API_URLS.BACKEND_URL}/admin/rooms`,
          formDataToSend,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
      }
      fetchRooms();
      onClose();
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({ type: '', price: 0, availability: 0, photos: [] });
    setSelectedFiles([]);
  };

  if (loading) return <div>Loading...</div>;

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      type: room.type,
      price: room.price,
      availability: room.availability,
      photos: []
    });
    onOpen();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${API_URLS.BACKEND_URL}/admin/rooms/${id}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      await fetchRooms();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete room');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
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
              Add New Room
            </Button>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-white bg-danger-400 rounded">
              {error}
            </div>
          )}

          <Table aria-label="Rooms table">
            <TableHeader>
              <TableColumn>PHOTOS</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>AVAILABILITY</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex gap-2">
                      {room.photos?.map((photo) => (
                        <Image
                          key={photo.id}
                          src={`${API_URLS.BACKEND_URL}${photo.photo_url}`}
                          alt={room.type}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>${room.price}</TableCell>
                  <TableCell>
                    <Chip color={room.availability > 0 ? "success" : "danger"} size="sm">
                      {room.availability} rooms
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" color="primary" onPress={() => handleEdit(room)}>
                        Edit
                      </Button>
                      <Button size="sm" color="danger" onPress={() => handleDelete(room.id)}>
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
              {editingRoom ? 'Edit Room' : 'Add New Room'}
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
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-4"
                />
                {selectedFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
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