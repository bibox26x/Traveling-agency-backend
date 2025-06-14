import { PrismaClient, Destination, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllDestinations = async (): Promise<Destination[]> => {
  try {
    const destinations = await prisma.destination.findMany({
      include: {
        trips: true
      }
    });
    return destinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    throw new Error('Failed to fetch destinations');
  }
};

export const getDestinationById = async (id: number): Promise<Destination | null> => {
  try {
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        trips: true
      }
    });
    return destination;
  } catch (error) {
    console.error(`Error fetching destination ${id}:`, error);
    throw new Error('Failed to fetch destination');
  }
};

type CreateDestinationInput = {
  name: string;
  description: string;
  imageUrl: string;
  country: string;
};

export const createDestination = async (data: CreateDestinationInput): Promise<Destination> => {
  try {
    const destination = await prisma.destination.create({
      data,
      include: {
        trips: true
      }
    });
    return destination;
  } catch (error) {
    console.error('Error creating destination:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A destination with this name already exists');
      }
    }
    throw new Error('Failed to create destination');
  }
};

type UpdateDestinationInput = Partial<CreateDestinationInput>;

export const updateDestination = async (id: number, data: UpdateDestinationInput): Promise<Destination | null> => {
  try {
    const existingDestination = await prisma.destination.findUnique({ where: { id } });
    if (!existingDestination) {
      throw new Error('Destination not found');
    }

    const destination = await prisma.destination.update({
      where: { id },
      data,
      include: {
        trips: true
      }
    });
    return destination;
  } catch (error) {
    console.error(`Error updating destination ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A destination with this name already exists');
      }
    }
    if (error instanceof Error && error.message === 'Destination not found') {
      throw error;
    }
    throw new Error('Failed to update destination');
  }
};

export const deleteDestination = async (id: number): Promise<void> => {
  try {
    const existingDestination = await prisma.destination.findUnique({ where: { id } });
    if (!existingDestination) {
      throw new Error('Destination not found');
    }

    await prisma.destination.delete({ where: { id } });
  } catch (error) {
    console.error(`Error deleting destination ${id}:`, error);
    if (error instanceof Error && error.message === 'Destination not found') {
      throw error;
    }
    throw new Error('Failed to delete destination');
  }
};

export const getDestinationTrips = async (id: number) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { destinationId: id },
      include: {
        destination: true,
        createdBy: true
      }
    });
    return trips;
  } catch (error) {
    console.error(`Error fetching trips for destination ${id}:`, error);
    throw new Error('Failed to fetch destination trips');
  }
}; 