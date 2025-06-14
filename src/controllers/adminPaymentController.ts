import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            trip: {
              select: {
                title: true
              }
            },
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

export const getPaymentsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;

    const payments = await prisma.payment.findMany({
      where: {
        status
      },
      include: {
        booking: {
          include: {
            trip: {
              select: {
                title: true
              }
            },
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments by status error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.$transaction([
      // Total payments
      prisma.payment.count(),
      // Pending payments
      prisma.payment.count({
        where: { status: 'pending' }
      }),
      // Confirmed payments
      prisma.payment.count({
        where: { status: 'confirmed' }
      }),
      // Total amount confirmed
      prisma.payment.aggregate({
        where: { status: 'confirmed' },
        _sum: {
          amount: true
        }
      })
    ]);

    res.json({
      total: stats[0],
      pending: stats[1],
      confirmed: stats[2],
      totalAmount: stats[3]._sum.amount || 0
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch payment statistics' });
  }
}; 