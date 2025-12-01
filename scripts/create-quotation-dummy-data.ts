#!/usr/bin/env ts-node

/**
 * Script to create comprehensive dummy quotation data
 * Uses existing business, customer, vendor, team, and traveller data
 */

import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Quotation from '../models/Quotation';
import Business from '../models/Business';
import Customer from '../models/Customer';
import Vendors from '../models/Vendors';
import Team from '../models/Team';
import Traveller from '../models/Traveller';

configDotenv();

const createQuotationDummyData = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    console.log('🎯 Creating Comprehensive Quotation Dummy Data...\n');
    
    // Get existing data
    const business = await Business.findOne({ businessName: 'Test Travel Agency 2' });
    const customers = await Customer.find({ businessId: business?._id }).limit(5);
    const vendors = await Vendors.find({ businessId: business?._id }).limit(5);
    const teamMembers = await Team.find({ businessId: business?._id }).limit(5);
    const travellers = await Traveller.find({ businessId: business?._id }).limit(5);
    
    if (!business || customers.length === 0 || teamMembers.length === 0) {
      console.log('❌ Insufficient data found. Need business, customers, and team members.');
      return;
    }
    
    console.log(`🏢 Using Business: ${business.businessName}`);
    console.log(`👥 Found ${customers.length} customers, ${vendors.length} vendors, ${teamMembers.length} team members, ${travellers.length} travellers\n`);
    
    // Define comprehensive quotation data
    const quotationTemplates = [
      // Flight Quotations
      {
        quotationType: 'flight' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['departure', 'Mumbai (BOM)'],
          ['destination', 'Delhi (DEL)'],
          ['departureDate', '2024-06-15'],
          ['returnDate', '2024-06-18'],
          ['class', 'Economy'],
          ['airline', 'IndiGo']
        ]),
        totalAmount: 12500,
        status: 'confirmed' as const,
        travelDate: new Date('2024-06-15'),
        adultTravlers: 2,
        childTravlers: 0,
        remarks: 'Business trip to Delhi for conference'
      },
      {
        quotationType: 'flight' as const,
        channel: 'B2B' as const,
        formFields: new Map([
          ['departure', 'Delhi (DEL)'],
          ['destination', 'Goa (GOI)'],
          ['departureDate', '2024-07-10'],
          ['returnDate', '2024-07-15'],
          ['class', 'Business'],
          ['airline', 'Air India']
        ]),
        totalAmount: 45000,
        status: 'draft' as const,
        travelDate: new Date('2024-07-10'),
        adultTravlers: 4,
        childTravlers: 2,
        remarks: 'Family vacation to Goa'
      },
      
      // Hotel Quotations
      {
        quotationType: 'hotel' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['hotelName', 'Taj Mahal Palace Mumbai'],
          ['location', 'Colaba, Mumbai'],
          ['checkIn', '2024-06-20'],
          ['checkOut', '2024-06-23'],
          ['roomType', 'Deluxe Sea View'],
          ['rooms', '2']
        ]),
        totalAmount: 85000,
        status: 'confirmed' as const,
        travelDate: new Date('2024-06-20'),
        adultTravlers: 3,
        childTravlers: 1,
        remarks: 'Anniversary celebration booking'
      },
      {
        quotationType: 'hotel' as const,
        channel: 'B2B' as const,
        formFields: new Map([
          ['hotelName', 'The Leela Goa'],
          ['location', 'Cavelossim Beach, Goa'],
          ['checkIn', '2024-08-05'],
          ['checkOut', '2024-08-10'],
          ['roomType', 'Premium Ocean View'],
          ['rooms', '3']
        ]),
        totalAmount: 125000,
        status: 'draft' as const,
        travelDate: new Date('2024-08-05'),
        adultTravlers: 6,
        childTravlers: 0,
        remarks: 'Corporate retreat accommodation'
      },

      // Train Quotations
      {
        quotationType: 'train' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['trainName', 'Rajdhani Express'],
          ['departure', 'Mumbai Central'],
          ['destination', 'New Delhi'],
          ['departureDate', '2024-09-12'],
          ['class', '2AC'],
          ['seats', '4']
        ]),
        totalAmount: 8500,
        status: 'confirmed' as const,
        travelDate: new Date('2024-09-12'),
        adultTravlers: 2,
        childTravlers: 2,
        remarks: 'Family trip to Delhi by train'
      },

      // Activity Quotations
      {
        quotationType: 'activity' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['activityName', 'Scuba Diving Experience'],
          ['location', 'Andaman Islands'],
          ['date', '2024-10-15'],
          ['duration', '4 hours'],
          ['participants', '2'],
          ['difficulty', 'Beginner']
        ]),
        totalAmount: 15000,
        status: 'draft' as const,
        travelDate: new Date('2024-10-15'),
        adultTravlers: 2,
        childTravlers: 0,
        remarks: 'Adventure activity for couple'
      },

      // Travel Package
      {
        quotationType: 'travel' as const,
        channel: 'B2B' as const,
        formFields: new Map([
          ['packageName', 'Golden Triangle Tour'],
          ['destinations', 'Delhi - Agra - Jaipur'],
          ['duration', '7 days 6 nights'],
          ['startDate', '2024-11-01'],
          ['endDate', '2024-11-07'],
          ['inclusions', 'Hotels, Transport, Guide, Meals']
        ]),
        totalAmount: 95000,
        status: 'confirmed' as const,
        travelDate: new Date('2024-11-01'),
        adultTravlers: 4,
        childTravlers: 1,
        remarks: 'Complete Golden Triangle package for family'
      },

      // Transport Land
      {
        quotationType: 'transport-land' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['vehicleType', 'Tempo Traveller'],
          ['route', 'Mumbai to Lonavala'],
          ['pickupDate', '2024-12-20'],
          ['returnDate', '2024-12-22'],
          ['passengers', '12'],
          ['driver', 'Included']
        ]),
        totalAmount: 18000,
        status: 'confirmed' as const,
        travelDate: new Date('2024-12-20'),
        adultTravlers: 8,
        childTravlers: 4,
        remarks: 'Group outing transport arrangement'
      },

      // Travel Insurance
      {
        quotationType: 'travel insurance' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['policyType', 'International Travel Insurance'],
          ['destination', 'Europe'],
          ['duration', '15 days'],
          ['coverage', '₹10,00,000'],
          ['travelers', '2'],
          ['startDate', '2025-01-15']
        ]),
        totalAmount: 3500,
        status: 'draft' as const,
        travelDate: new Date('2025-01-15'),
        adultTravlers: 2,
        childTravlers: 0,
        remarks: 'Insurance for Europe honeymoon trip'
      },

      // Visa Services
      {
        quotationType: 'visas' as const,
        channel: 'B2B' as const,
        formFields: new Map([
          ['visaType', 'Tourist Visa'],
          ['country', 'Thailand'],
          ['applicants', '4'],
          ['processingTime', '7-10 working days'],
          ['validity', '60 days'],
          ['entries', 'Single Entry']
        ]),
        totalAmount: 12000,
        status: 'confirmed' as const,
        travelDate: new Date('2025-02-01'),
        adultTravlers: 4,
        childTravlers: 0,
        remarks: 'Thailand visa processing for group'
      },

      // Cancelled Quotations for variety
      {
        quotationType: 'flight' as const,
        channel: 'B2C' as const,
        formFields: new Map([
          ['departure', 'Bangalore (BLR)'],
          ['destination', 'Chennai (MAA)'],
          ['departureDate', '2024-05-20'],
          ['class', 'Economy'],
          ['airline', 'SpiceJet']
        ]),
        totalAmount: 6500,
        status: 'cancelled' as const,
        travelDate: new Date('2024-05-20'),
        adultTravlers: 1,
        childTravlers: 0,
        remarks: 'Cancelled due to change in plans'
      },

      {
        quotationType: 'hotel' as const,
        channel: 'B2B' as const,
        formFields: new Map([
          ['hotelName', 'ITC Grand Chola'],
          ['location', 'Chennai'],
          ['checkIn', '2024-08-15'],
          ['checkOut', '2024-08-18'],
          ['roomType', 'Executive Suite'],
          ['rooms', '1']
        ]),
        totalAmount: 35000,
        status: 'cancelled' as const,
        travelDate: new Date('2024-08-15'),
        adultTravlers: 2,
        childTravlers: 0,
        remarks: 'Event cancelled, booking cancelled'
      }
    ];
    
    console.log('📝 Creating quotations...\n');
    
    const createdQuotations = [];
    
    for (let i = 0; i < quotationTemplates.length; i++) {
      const template = quotationTemplates[i];
      
      // Randomly assign customer, vendor, team member, and travellers
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomVendor = vendors.length > 0 ? vendors[Math.floor(Math.random() * vendors.length)] : null;
      const randomTeamMember = teamMembers[Math.floor(Math.random() * teamMembers.length)];
      const randomTravellers = travellers.length > 0 ? 
        travellers.slice(0, Math.floor(Math.random() * Math.min(3, travellers.length)) + 1) : [];
      
      const quotationData = {
        ...template,
        businessId: business._id,
        customerId: randomCustomer._id,
        vendorId: randomVendor?._id,
        owner: [randomTeamMember._id],
        travelers: randomTravellers.map(t => t._id)
      };
      
      const quotation = new Quotation(quotationData);
      await quotation.save();
      
      console.log(`✅ Created quotation ${i + 1}:`);
      console.log(`   Custom ID: ${quotation.customId}`);
      console.log(`   Type: ${quotation.quotationType} | Channel: ${quotation.channel}`);
      console.log(`   Customer: ${randomCustomer.name}`);
      console.log(`   Vendor: ${randomVendor?.companyName || 'None'}`);
      console.log(`   Amount: ₹${quotation.totalAmount.toLocaleString()}`);
      console.log(`   Status: ${quotation.status}`);
      console.log(`   Travellers: ${randomTravellers.length > 0 ? randomTravellers.map(t => t.name).join(', ') : 'None'}\n`);
      
      createdQuotations.push(quotation);
    }
    
    console.log(`🎉 Successfully created ${createdQuotations.length} quotations!\n`);
    
    // Display summary
    console.log('📊 Summary by Type:');
    const summary = createdQuotations.reduce((acc, q) => {
      acc[q.quotationType] = (acc[q.quotationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} quotations`);
    });
    
    console.log('\n📊 Summary by Status:');
    const statusSummary = createdQuotations.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(statusSummary).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} quotations`);
    });
    
    const totalAmount = createdQuotations.reduce((sum, q) => sum + q.totalAmount, 0);
    console.log(`\n💰 Total Amount: ₹${totalAmount.toLocaleString()}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error creating quotation dummy data:', error);
    await mongoose.disconnect();
  }
};

createQuotationDummyData();
