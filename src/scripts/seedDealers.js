require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Agency = require('../models/Agency');
const DealerProfile = require('../models/DealerProfile');
const DealerReview = require('../models/DealerReview');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nomigull3369798576_db_user:1yUHSgguXS0L9kmF@cluster0.jyh1zig.mongodb.net/?appName=Cluster0";

const dealersData = [
  {
    name: 'Muhammad Ali',
    email: 'ali@primeestate.com',
    phone: '+92 300 1234567',
    agency: 'Prime Estate',
    experience: 8,
    city: 'Karachi',
    services: ['Residential Sales', 'DHA Portfolios', 'Commercial Leasing'],
    rating: 4.8,
    reviewsCount: 72,
    activeListings: 35,
    propertiesSold: 120,
    responseTime: '15 Minutes',
    about: 'Muhammad Ali is a senior real estate advisor with Prime Estate. Specializing in DHA Karachi residential properties with over 8 years of transaction management experience.',
    isFeatured: true,
    cnic: '42101-1234567-1',
    license: 'LIC-KHI-8877',
    reviews: [
      { commenter: 'Nabeel Qasim', rating: 5, comment: 'Excellent deal closing! Very professional and helpful through all registry steps.' },
      { commenter: 'Zeeshan Khan', rating: 4, comment: 'Prompt response time and honest advice on DHA rates.' }
    ]
  },
  {
    name: 'Ahmed Khan',
    email: 'ahmed@cityexperts.com',
    phone: '+92 300 2345678',
    agency: 'City Property Experts',
    experience: 10,
    city: 'Lahore',
    services: ['Commercial Projects', 'Plot Appraisals', 'Corporate Rentals'],
    rating: 4.9,
    reviewsCount: 98,
    activeListings: 42,
    propertiesSold: 155,
    responseTime: '20 Minutes',
    about: 'Ahmed Khan specializes in Lahore commercial plots, DHA Phase 6 to 8 projects, and industrial zone property consultancy. Working with local and overseas buyers.',
    isFeatured: true,
    cnic: '35202-2345678-1',
    license: 'LIC-LHR-2233',
    reviews: [
      { commenter: 'Asif Ali', rating: 5, comment: ' Ahmed khan assisted us in buying a commercial plaza. Smooth transaction management.' },
      { commenter: 'Mariam Shah', rating: 5, comment: 'Highly recommended for overseas clients. Transparent process!' }
    ]
  },
  {
    name: 'Hassan Raza',
    email: 'hassan@dreamhomes.com',
    phone: '+92 300 3456789',
    agency: 'Dream Homes',
    experience: 12,
    city: 'Islamabad',
    services: ['Luxury Villas', 'F-7 & E-7 Estates', 'Asset Valuations'],
    rating: 4.9,
    reviewsCount: 110,
    activeListings: 28,
    propertiesSold: 190,
    responseTime: '10 Minutes',
    about: 'Hassan Raza is a premium property dealer in Islamabad. Specializes in luxury villas, residential plots in CDA sectors, and secure investment assets.',
    isFeatured: true,
    cnic: '37405-3456789-1',
    license: 'LIC-ISB-0099',
    reviews: [
      { commenter: 'Dr. Faisal', rating: 5, comment: ' Hassan is extremely knowledgeable about Islamabad real estate. Bought our F-8 villa through him.' }
    ]
  },
  {
    name: 'Bilal Ahmed',
    email: 'bilal@urbanestate.com',
    phone: '+92 300 4567890',
    agency: 'Urban Estate',
    experience: 5,
    city: 'Karachi',
    services: ['Renting & Lease', 'Apartment Portfolios', 'Property Management'],
    rating: 4.6,
    reviewsCount: 45,
    activeListings: 20,
    propertiesSold: 80,
    responseTime: '30 Minutes',
    about: 'Bilal specializes in rentals and apartment portfolios in Clifton, Gulshan-e-Iqbal, and Federal B Area. Focuses on customer satisfaction.',
    isFeatured: false,
    cnic: '42201-4567890-1',
    license: 'LIC-KHI-4545',
    reviews: [
      { commenter: 'Zainab Bibi', rating: 4, comment: 'Helpful in finding a flat on rent within our budget.' }
    ]
  },
  {
    name: 'Usman Tariq',
    email: 'usman@capitalrealtors.com',
    phone: '+92 300 5678901',
    agency: 'Capital Realtors',
    experience: 15,
    city: 'Islamabad',
    services: ['Plots & Commercial Lands', 'B-17 Projects', 'Land Acquisition'],
    rating: 4.7,
    reviewsCount: 85,
    activeListings: 33,
    propertiesSold: 140,
    responseTime: '15 Minutes',
    about: 'Usman is an expert in bulk land acquisitions, CDA commercial layouts, and Rawalpindi housing societies investments.',
    isFeatured: false,
    cnic: '37405-5678901-1',
    license: 'LIC-ISB-1515',
    reviews: [
      { commenter: 'Tariq Mehmood', rating: 5, comment: 'Great dealer for commercial plot investments in Islamabad.' }
    ]
  },
  {
    name: 'Ali Hamza',
    email: 'hamza@smartproperty.com',
    phone: '+92 300 6789012',
    agency: 'Smart Property Solutions',
    experience: 6,
    city: 'Lahore',
    services: ['Apartment Portfolios', 'Johr Town Rentals', 'Property Valuation'],
    rating: 4.5,
    reviewsCount: 32,
    activeListings: 18,
    propertiesSold: 55,
    responseTime: '25 Minutes',
    about: 'Ali Hamza helps young professionals and students find suitable rental homes and apartments in Johar Town and DHA.',
    isFeatured: false,
    cnic: '35201-6789012-1',
    license: 'LIC-LHR-6060',
    reviews: []
  },
  {
    name: 'Fahad Malik',
    email: 'fahad@eliteproperties.com',
    phone: '+92 300 7890123',
    agency: 'Elite Properties',
    experience: 20,
    city: 'Karachi',
    services: ['High-rise Commercials', 'Penthouse Sales', 'Investment Portfolios'],
    rating: 5.0,
    reviewsCount: 145,
    activeListings: 50,
    propertiesSold: 300,
    responseTime: '10 Minutes',
    about: 'Fahad Malik is a veteran real estate consultant with 20 years of experience. Assisting high-net-worth clients in commercial skyscrapers and premium penthouses.',
    isFeatured: false,
    cnic: '42101-7890123-1',
    license: 'LIC-KHI-2020',
    reviews: [
      { commenter: 'Kashif Razzaq', rating: 5, comment: 'Fahad is the king of Clifton high-rise commercials. Exceptionally seamless deal!' }
    ]
  },
  {
    name: 'Salman Shah',
    email: 'salman@futurehomes.com',
    phone: '+92 300 8901234',
    agency: 'Future Homes',
    experience: 4,
    city: 'Rawalpindi',
    services: ['Residential Rentals', 'Bahria Town Homes', 'Leasing Services'],
    rating: 4.6,
    reviewsCount: 22,
    activeListings: 15,
    propertiesSold: 35,
    responseTime: '40 Minutes',
    about: 'Salman specializes in residential properties, townhouses, and rental listings inside Bahria Town Rawalpindi and DHA Phase 1-4.',
    isFeatured: false,
    cnic: '37402-8901234-1',
    license: 'LIC-RWP-4040',
    reviews: []
  },
  {
    name: 'Imran Qureshi',
    email: 'imran@skylineestate.com',
    phone: '+92 300 9012345',
    agency: 'Skyline Estate',
    experience: 18,
    city: 'Faisalabad',
    services: ['Industrial Areas', 'Agricultural Land', 'Commercial Plazas'],
    rating: 4.7,
    reviewsCount: 68,
    activeListings: 25,
    propertiesSold: 110,
    responseTime: '35 Minutes',
    about: 'Imran Qureshi is Faisalabad\'s top industrial property consultant, advising on factory sites, warehouses, and commercial plots.',
    isFeatured: false,
    cnic: '33100-9012345-1',
    license: 'LIC-FSD-1818',
    reviews: [
      { commenter: 'Farhan Qazi', rating: 5, comment: 'Acquired our factory land through Imran. Excellent legal checks.' }
    ]
  },
  {
    name: 'Danish Iqbal',
    email: 'danish@royalproperty.com',
    phone: '+92 300 0123456',
    agency: 'Royal Property Hub',
    experience: 7,
    city: 'Multan',
    services: ['Farm Houses', 'Agricultural Lands', 'DHA Multan Residential'],
    rating: 4.8,
    reviewsCount: 40,
    activeListings: 22,
    propertiesSold: 75,
    responseTime: '20 Minutes',
    about: 'Danish is the Multan expert, helping buyers find premium farmhouses and DHA Multan plots at competitive prices.',
    isFeatured: false,
    cnic: '36302-0123456-1',
    license: 'LIC-MTN-0707',
    reviews: []
  },
  {
    name: 'Ayesha Noor',
    email: 'ayesha@luxuryliving.com',
    phone: '+92 300 1122334',
    agency: 'Luxury Living',
    experience: 9,
    city: 'Lahore',
    services: ['Interior Designed Homes', 'DHA Villas', 'Gated Community Assets'],
    rating: 4.9,
    reviewsCount: 76,
    activeListings: 30,
    propertiesSold: 130,
    responseTime: '15 Minutes',
    about: 'Ayesha Noor specializes in luxury interior-designed homes, designer villas, and high-end residential listings in Lahore.',
    isFeatured: false,
    cnic: '35202-1122334-2',
    license: 'LIC-LHR-9090',
    reviews: [
      { commenter: 'Sadia Malik', rating: 5, comment: 'Ayesha has an eye for beautiful homes. Found our luxury villa in DHA Phase 5.' }
    ]
  },
  {
    name: 'Sarah Khan',
    email: 'sarah@platinumestate.com',
    phone: '+92 300 4455667',
    agency: 'Platinum Estate',
    experience: 11,
    city: 'Karachi',
    services: ['DHA Properties', 'Clifton Apartments', 'Off-Plan Project Investments'],
    rating: 4.8,
    reviewsCount: 88,
    activeListings: 27,
    propertiesSold: 160,
    responseTime: '15 Minutes',
    about: 'Sarah Khan is a dedicated consultant for Clifton and DHA apartments, providing transparent and efficient transaction handling.',
    isFeatured: false,
    cnic: '42301-4455667-2',
    license: 'LIC-KHI-1111',
    reviews: []
  }
];

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Starting cleanup...');

    // Delete existing demo records to prevent duplicates
    const emails = dealersData.map(d => d.email);
    const agencyNames = dealersData.map(d => d.agency);

    const deletedUsers = await User.deleteMany({ email: { $in: emails } });
    console.log(`Deleted ${deletedUsers.deletedCount} existing demo users.`);

    const deletedAgencies = await Agency.deleteMany({ name: { $in: agencyNames } });
    console.log(`Deleted ${deletedAgencies.deletedCount} existing demo agencies.`);

    // Keep user IDs for review mapping
    const createdUsers = [];

    // 1. Create Agencies and User accounts
    for (const data of dealersData) {
      // Create Agency
      const agency = await Agency.create({
        name: data.agency,
        address: `${data.city}, Pakistan`,
        phone: data.phone,
        email: data.email,
        description: `${data.agency} is a leading real estate agency specializing in properties in ${data.city}.`,
        logo: {
          public_id: null,
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop'
        },
        banner: {
          public_id: null,
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop'
        }
      });

      // Create User
      const user = await User.create({
        name: data.name,
        email: data.email,
        password: 'password123', // auto hashed via pre-save hook
        role: 'agent',
        phone: data.phone,
        avatar: {
          public_id: null,
          url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop'
        }
      });

      createdUsers.push({ user, agency, meta: data });
    }

    console.log(`Created ${createdUsers.length} user and agency records.`);

    // 2. Create Dealer Profiles & Reviews
    let profileCount = 0;
    let reviewCount = 0;

    for (const record of createdUsers) {
      const { user, agency, meta } = record;

      // Clean old profiles
      await DealerProfile.deleteMany({ userId: user._id });

      // Create profile
      const profile = await DealerProfile.create({
        userId: user._id,
        agencyId: agency._id,
        experience: meta.experience,
        city: meta.city,
        languages: ['English', 'Urdu'],
        responseTime: meta.responseTime,
        soldPropertiesCount: meta.propertiesSold,
        happyClientsCount: meta.propertiesSold + 10,
        services: meta.services,
        about: meta.about,
        cnicNumber: meta.cnic,
        licenseNumber: meta.license,
        verificationStatus: {
          cnicVerified: true,
          officeVerified: true,
          licenseVerified: true,
          phoneVerified: true,
          emailVerified: true
        },
        isApproved: true,
        isFeatured: meta.isFeatured,
        rating: meta.rating,
        reviewsCount: meta.reviewsCount
      });

      profileCount++;

      // Create dummy reviews
      if (meta.reviews && meta.reviews.length > 0) {
        // Find or create a dummy reviewer
        let reviewer = await User.findOne({ email: 'client@propertyhub.com' });
        if (!reviewer) {
          reviewer = await User.create({
            name: 'Demo Reviewer',
            email: 'client@propertyhub.com',
            password: 'password123',
            role: 'user',
            phone: '+92 300 0000000'
          });
        }

        for (const rev of meta.reviews) {
          // Delete old reviews
          await DealerReview.deleteMany({ userId: reviewer._id, dealerId: user._id });

          await DealerReview.create({
            userId: reviewer._id,
            dealerId: user._id,
            rating: rev.rating,
            comment: rev.comment
          });
          reviewCount++;
        }
      }
    }

    console.log(`Created ${profileCount} dealer profiles and ${reviewCount} reviews.`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
