import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@nextui-org/react";

interface ErrorNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  errors: Record<string, string>;
}

export default function ErrorNotification({ isOpen, onClose, errors }: ErrorNotificationProps) {
  const errorMessages = Object.entries(errors).filter(([_, value]) => value);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader className="text-red-500">Booking Validation Errors</ModalHeader>
        <ModalBody className="pb-6">
          <ul className="list-disc pl-4 space-y-2">
            {errorMessages.map(([field, message]) => (
              <li key={field} className="text-sm text-gray-700">
                {message}
              </li>
            ))}
          </ul>
          <Button 
            color="primary" 
            onPress={onClose}
            className="w-full mt-4"
          >
            Got it
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
