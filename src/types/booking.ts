export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface BookingCreateInput {
  userId: number;
  tripId: number;
  guests: number;
  specialRequirements?: string;
}

export interface BookingResponse {
  id: number;
  userId: number;
  tripId: number;
  guests: number;
  specialRequirements?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  bookingDate: Date;
  createdAt: Date;
  updatedAt: Date;
  trip: {
    id: number;
    title: string;
    description: string;
    location: string;
    startDate: Date;
    price: number;
    imageUrl: string;
    duration: number;
    destinationId: number | null;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
} 