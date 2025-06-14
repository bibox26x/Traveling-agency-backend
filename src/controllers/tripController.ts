import { Request, Response } from 'express';
import * as tripService from '../services/tripService';
import { Trip } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Helper function to calculate end date
const calculateEndDate = (startDate: Date, duration: number): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (duration - 1)); // -1 because duration includes start date
  return endDate;
};

// Helper function to add end date to trip data
const addEndDateToTrip = (trip: Trip) => {
  return {
    ...trip,
    endDate: calculateEndDate(trip.startDate, trip.duration)
  };
};

export const getAllTrips = async (req: Request, res: Response) => {
  try {
    const trips = await tripService.getAllTrips();
    const tripsWithEndDate = trips.map(addEndDateToTrip);
    res.json(tripsWithEndDate);
  } catch (error) {
    console.error('Error in getAllTrips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

export const getTripById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    const trip = await tripService.getTripById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(addEndDateToTrip(trip));
  } catch (error) {
    console.error('Error in getTripById:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      location,
      imageUrl,
      startDate,
      duration,
      price,
      createdById,
      destinationId
    } = req.body;

    // Validate all required fields
    const requiredFields = {
      title: title,
      description: description,
      location: location,
      startDate: startDate,
      duration: duration,
      price: price,
      createdById: createdById
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      logger.warn(`Missing required fields in trip creation: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Validate data types and formats
    if (isNaN(parseFloat(price))) {
      return res.status(400).json({ error: 'Invalid price format' });
    }

    if (isNaN(parseInt(duration)) || parseInt(duration) < 1) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start date format' });
    }

    if (isNaN(parseInt(createdById))) {
      return res.status(400).json({ error: 'Invalid createdById format' });
    }

    // Validate destinationId if provided
    let parsedDestinationId = null;
    if (destinationId) {
      parsedDestinationId = parseInt(destinationId);
      if (isNaN(parsedDestinationId)) {
        return res.status(400).json({ error: 'Invalid destination ID format' });
      }
    }

    // Parse dates and numbers
    const tripData = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      imageUrl: imageUrl?.trim() || '',
      startDate: parsedStartDate,
      duration: parseInt(duration),
      price: parseFloat(price),
      createdById: parseInt(createdById),
      destinationId: parsedDestinationId
    };

    const trip = await tripService.createTrip(tripData);
    res.status(201).json(addEndDateToTrip(trip));
  } catch (error) {
    logger.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

interface UpdateTripFields {
  title?: string;
  description?: string;
  location?: string;
  imageUrl?: string;
  startDate?: Date;
  duration?: number;
  price?: number;
  destinationId?: number | null;
}

export const updateTrip = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    const updateData: UpdateTripFields = {};
    const fields: (keyof UpdateTripFields)[] = [
      'title', 'description', 'location', 'imageUrl', 'startDate',
      'duration', 'price', 'destinationId'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate') {
          const parsedDate = new Date(req.body[field]);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid start date format');
          }
          updateData[field] = parsedDate;
        } else if (field === 'price') {
          const parsedPrice = parseFloat(req.body[field]);
          if (isNaN(parsedPrice)) {
            throw new Error('Invalid price format');
          }
          updateData[field] = parsedPrice;
        } else if (field === 'duration') {
          const parsedDuration = parseInt(req.body[field]);
          if (isNaN(parsedDuration) || parsedDuration < 1) {
            throw new Error('Duration must be a positive number');
          }
          updateData[field] = parsedDuration;
        } else if (field === 'destinationId') {
          if (req.body[field] === null) {
            updateData[field] = null;
          } else {
            const parsedDestinationId = parseInt(req.body[field]);
            if (isNaN(parsedDestinationId)) {
              throw new Error('Invalid destination ID format');
            }
            updateData[field] = parsedDestinationId;
          }
        } else {
          updateData[field] = req.body[field].trim();
        }
      }
    });

    const trip = await tripService.updateTrip(id, updateData);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(addEndDateToTrip(trip));
  } catch (error) {
    logger.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
};

export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    await tripService.deleteTrip(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTrip:', error);
    if (error instanceof Error && error.message === 'Trip not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete trip' });
  }
};

export const updateTripDestination = async (req: AuthenticatedRequest, res: Response) => {
  const tripId = Number(req.params.id);
  const { destinationId } = req.body;

  try {
    if (isNaN(tripId)) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    if (isNaN(destinationId)) {
      return res.status(400).json({ error: 'Invalid destination ID' });
    }

    // First check if the destination exists
    const destination = await prisma.destination.findUnique({
      where: { id: destinationId }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    // Get the trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Update the trip's destination
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { destinationId },
      include: {
        destination: true
      }
    });

    logger.business('trip_destination_updated', {
      tripId,
      oldDestinationId: trip.destinationId,
      newDestinationId: destinationId,
      adminId: req.user.userId,
      requestId: req.headers['x-request-id']
    });

    res.json(updatedTrip);
  } catch (error) {
    logger.error('Error updating trip destination:', {
      error,
      tripId,
      destinationId,
      adminId: req.user.userId
    });
    res.status(500).json({ error: 'Failed to update trip destination' });
  }
};
