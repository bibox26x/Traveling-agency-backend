export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Trip {
  id: number;
  title: string;
  price: number;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  imageUrl: string;
  capacity: number;
  currentParticipants: number;
  difficultyLevel: string;
  destinationId: number | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Booking {
  id: number;
  userId: number;
  tripId: number;
  guests: number;
  status: string;
  trip: Trip;
  user: User;
}

export interface PrismaBooking extends Omit<Booking, 'user'> {
  user?: User;
}

export interface Payment {
  id: number;
  userId: number;
  bookingId: number;
  amount: number;
  paymentMethod: string;
  proofImage: string | null;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  booking?: PrismaBooking;
}

export interface PaymentWithEnumStatus extends Omit<Payment, 'status'> {
  status: PaymentStatus;
}

export interface PaymentStats {
  status: PaymentStatus;
  _count: number;
  _sum: {
    amount: number;
  };
} 