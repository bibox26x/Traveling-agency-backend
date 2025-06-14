import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample destinations
  const destinations = [
    {
      name: 'Paris',
      description: 'The City of Light, known for its iconic Eiffel Tower, world-class museums, and exquisite cuisine.',
      imageUrl: 'https://picsum.photos/800/600?paris',
      country: 'France'
    },
    {
      name: 'Moscow',
      description: 'A city where traditional Russian architecture meets modern culture, featuring the iconic Red Square and Saint Basil\'s Cathedral.',
      imageUrl: 'https://picsum.photos/800/600?moscow',
      country: 'Russia'
    },
    {
      name: 'Tokyo',
      description: 'A fascinating blend of ultra-modern and traditional, where ancient temples stand in the shadow of soaring skyscrapers.',
      imageUrl: 'https://picsum.photos/800/600?tokyo',
      country: 'Japan'
    },
    {
      name: 'New York',
      description: 'The city that never sleeps, offering world-famous attractions, diverse neighborhoods, and endless entertainment options.',
      imageUrl: 'https://picsum.photos/800/600?newyork',
      country: 'United States'
    },
    {
      name: 'Rome',
      description: 'The Eternal City, home to ancient ruins, artistic masterpieces, and the world\'s best Italian cuisine.',
      imageUrl: 'https://picsum.photos/800/600?rome',
      country: 'Italy'
    }
  ];

  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { name: destination.name },
      update: destination,
      create: destination
    });
  }

  // Get all destinations
  const createdDestinations = await prisma.destination.findMany();

  // Create sample trips for each destination
  for (const destination of createdDestinations) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 3);

    await prisma.trip.create({
      data: {
        title: `${destination.name} Adventure`,
        description: `Experience the best of ${destination.name} with our carefully curated trip package.`,
        location: destination.name,
        imageUrl: `https://picsum.photos/800/600?${destination.name.toLowerCase()}`,
        startDate,
        price: Math.floor(Math.random() * 2000) + 1000,
        capacity: Math.floor(Math.random() * 15) + 5,
        currentParticipants: 0,
        difficultyLevel: ['easy', 'moderate', 'challenging'][Math.floor(Math.random() * 3)],
        destinationId: destination.id,
        createdById: 1 // Assuming admin user has ID 1
      }
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
