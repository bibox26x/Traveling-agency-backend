import { Request, Response, RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import * as destinationService from '../services/destinationService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Get all destinations
export const getAllDestinations = async (req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany({
      include: {
        trips: true
      }
    });
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
};

// Get destination by ID
export const getDestinationById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const destination = await prisma.destination.findUnique({
      where: { id: parseInt(id) },
      include: {
        trips: true
      }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    res.json(destination);
  } catch (error) {
    console.error('Error fetching destination:', error);
    res.status(500).json({ error: 'Failed to fetch destination' });
  }
};

// Create destination (Admin only)
export const createDestination: RequestHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, imageUrl, country } = req.body;

    const destination = await prisma.destination.create({
      data: {
        name,
        description,
        imageUrl,
        country
      }
    });

    res.status(201).json(destination);
  } catch (error) {
    logger.error('Create destination error:', error);
    res.status(500).json({ error: 'Failed to create destination' });
  }
};

// Update destination (Admin only)
export const updateDestination: RequestHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, imageUrl, country } = req.body;

    const destination = await prisma.destination.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(imageUrl && { imageUrl }),
        ...(country && { country })
      }
    });

    res.json(destination);
  } catch (error) {
    logger.error('Update destination error:', error);
    res.status(500).json({ error: 'Failed to update destination' });
  }
};

// Delete destination (Admin only)
export const deleteDestination: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.destination.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Destination deleted successfully' });
  } catch (error) {
    logger.error('Delete destination error:', error);
    res.status(500).json({ error: 'Failed to delete destination' });
  }
};

// Assign trip to destination (Admin only)
export const assignTripToDestination: RequestHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { destinationId } = req.params;
    const { tripId } = req.body;

    const trip = await prisma.trip.update({
      where: { id: Number(tripId) },
      data: {
        destinationId: Number(destinationId)
      },
      include: {
        destination: true
      }
    });

    res.json(trip);
  } catch (error) {
    logger.error('Assign trip to destination error:', error);
    res.status(500).json({ error: 'Failed to assign trip to destination' });
  }
};

// Remove trip from destination (Admin only)
export const removeTripFromDestination: RequestHandler = async (req, res) => {
  try {
    const { destinationId, tripId } = req.params;

    const trip = await prisma.trip.update({
      where: { 
        id: Number(tripId),
        destinationId: Number(destinationId)
      },
      data: {
        destinationId: null
      }
    });

    res.json(trip);
  } catch (error) {
    logger.error('Remove trip from destination error:', error);
    res.status(500).json({ error: 'Failed to remove trip from destination' });
  }
};

export const getDestinationTrips = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid destination ID' });
    }

    const trips = await destinationService.getDestinationTrips(id);
    res.json(trips);
  } catch (error) {
    console.error('Error in getDestinationTrips:', error);
    res.status(500).json({ error: 'Failed to fetch destination trips' });
  }
}; 