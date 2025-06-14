import { PrismaClient, Trip, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllTrips = async (): Promise<Trip[]> => {
  try {
    const trips = await prisma.trip.findMany({ 
      orderBy: { startDate: 'asc' },
      include: { createdBy: true }
    });
    return trips;
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw new Error('Failed to fetch trips');
  }
};

export const getTripById = async (id: number): Promise<Trip | null> => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { createdBy: true }
    });
    return trip;
  } catch (error) {
    console.error(`Error fetching trip ${id}:`, error);
    throw new Error('Failed to fetch trip');
  }
};

type CreateTripInput = {
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  startDate: Date;
  duration: number;
  price: number;
  createdById: number;
};

export const createTrip = async (data: CreateTripInput): Promise<Trip> => {
  try {
    // Set default values and validate data
    const tripData = {
      ...data,
      imageUrl: data.imageUrl || ''
    };

    const trip = await prisma.trip.create({
      data: tripData,
      include: { createdBy: true }
    });
    return trip;
  } catch (error) {
    console.error('Error creating trip:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A trip with this title already exists');
      }
    }
    throw new Error('Failed to create trip');
  }
};

type UpdateTripInput = Partial<{
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDate: Date;
  duration: number;
  price: number;
}>;

export const updateTrip = async (id: number, data: UpdateTripInput): Promise<Trip | null> => {
  try {
    // Validate the trip exists
    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    const trip = await prisma.trip.update({
      where: { id },
      data,
      include: { createdBy: true }
    });
    return trip;
  } catch (error) {
    console.error(`Error updating trip ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A trip with this title already exists');
      }
    }
    if (error instanceof Error && error.message === 'Trip not found') {
      throw error;
    }
    throw new Error('Failed to update trip');
  }
};

export const deleteTrip = async (id: number): Promise<void> => {
  try {
    // Validate the trip exists
    const existingTrip = await prisma.trip.findUnique({ where: { id } });
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    await prisma.trip.delete({ where: { id } });
  } catch (error) {
    console.error(`Error deleting trip ${id}:`, error);
    if (error instanceof Error && error.message === 'Trip not found') {
      throw error;
    }
    throw new Error('Failed to delete trip');
  }
};
