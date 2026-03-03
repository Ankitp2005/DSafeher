const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding safe places...');

    const safePlaces = [
        // Delhi NCR
        { name: 'Parliament Street Police Station', type: 'POLICE', latitude: 28.6226, longitude: 77.2162, address: 'Parliament St, New Delhi' },
        { name: 'AIIMS Hospital', type: 'HOSPITAL', latitude: 28.5672, longitude: 77.2100, address: 'Ansari Nagar, New Delhi' },
        { name: 'Connaught Place Police Station', type: 'POLICE', latitude: 28.6315, longitude: 77.2167, address: 'Block A, CP, New Delhi' },
        { name: 'Safdarjung Hospital', type: 'HOSPITAL', latitude: 28.5684, longitude: 77.2064, address: 'Ring Road, New Delhi' },
        { name: 'Hauz Khas Police Station', type: 'POLICE', latitude: 28.5494, longitude: 77.2001, address: 'Hauz Khas, New Delhi' },
        // Mumbai
        { name: 'Colaba Police Station', type: 'POLICE', latitude: 18.9067, longitude: 72.8147, address: 'Colaba, Mumbai' },
        { name: 'Breach Candy Hospital', type: 'HOSPITAL', latitude: 18.9717, longitude: 72.8050, address: 'Bhulabhai Desai Rd, Mumbai' },
        { name: 'Bandra Police Station', type: 'POLICE', latitude: 19.0596, longitude: 72.8295, address: 'Bandra West, Mumbai' },
        { name: 'Lilavati Hospital', type: 'HOSPITAL', latitude: 19.0509, longitude: 72.8289, address: 'Bandra, Mumbai' },
        // Bangalore
        { name: 'Cubbon Park Police Station', type: 'POLICE', latitude: 12.9763, longitude: 77.5929, address: 'Cubbon Park, Bengaluru' },
        { name: 'St Johns Medical College Hospital', type: 'HOSPITAL', latitude: 12.9314, longitude: 77.6196, address: 'Koramangala, Bengaluru' },
        { name: 'Koramangala Police Station', type: 'POLICE', latitude: 12.9352, longitude: 77.6245, address: 'Koramangala, Bengaluru' },
        // Fire Stations
        { name: 'Delhi Fire Station - Connaught Place', type: 'FIRE_STATION', latitude: 28.6340, longitude: 77.2193, address: 'CP, New Delhi' },
        { name: 'Mumbai Fire Station - Fort', type: 'FIRE_STATION', latitude: 18.9340, longitude: 72.8355, address: 'Fort, Mumbai' },
    ];

    for (const place of safePlaces) {
        await prisma.safePlace.upsert({
            where: { id: `seed-${place.name.replace(/\s+/g, '-').toLowerCase()}` },
            update: place,
            create: { ...place, id: `seed-${place.name.replace(/\s+/g, '-').toLowerCase()}` }
        });
    }

    console.log(`Seeded ${safePlaces.length} safe places`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
