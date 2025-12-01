import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Traveller from '../models/Traveller';
import Business from '../models/Business';
import Customer from '../models/Customer';

configDotenv();

const testTravellerAPI = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get a business and customer for testing
    const business = await Business.findOne({});
    const customer = await Customer.findOne({ businessId: business?._id });
    
    if (!business) {
      console.log('No business found for testing');
      return;
    }
    
    console.log(`Testing with business: ${business.businessName}`);
    console.log(`Using customer: ${customer?.name || 'No customer'}`);
    
    // Create test travellers
    const testTravellers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        passportNumber: 'A12345678',
        passportExpiry: new Date('2030-12-31'),
        nationality: 'American',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'male' as const,
        address: '123 Main St, New York, NY 10001',
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+1-555-0102',
          relationship: 'Spouse'
        },
        businessId: business._id,
        customerId: customer?._id
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1-555-0201',
        passportNumber: 'B87654321',
        passportExpiry: new Date('2029-08-15'),
        nationality: 'Spanish',
        dateOfBirth: new Date('1990-03-22'),
        gender: 'female' as const,
        address: '456 Oak Ave, Los Angeles, CA 90210',
        emergencyContact: {
          name: 'Carlos Garcia',
          phone: '+1-555-0202',
          relationship: 'Brother'
        },
        businessId: business._id,
        customerId: customer?._id
      },
      {
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        phone: '+1-555-0301',
        nationality: 'Canadian',
        dateOfBirth: new Date('1988-11-10'),
        gender: 'other' as const,
        businessId: business._id
        // No passport info or customer association
      }
    ];
    
    console.log('\n=== Creating Test Travellers ===');
    
    // Clear existing travellers for this business
    await Traveller.deleteMany({ businessId: business._id });
    console.log('Cleared existing travellers');
    
    const createdTravellers = [];
    for (let i = 0; i < testTravellers.length; i++) {
      const traveller = new Traveller(testTravellers[i]);
      await traveller.save();
      
      // Populate the traveller
      await traveller.populate([
        {
          path: 'businessId',
          select: 'businessName businessType',
        },
        {
          path: 'customerId',
          select: 'name email phone',
        }
      ]);
      
      createdTravellers.push(traveller);
      console.log(`${i + 1}. Created: ${traveller.name} (${traveller.nationality || 'No nationality'})`);
      if (traveller.passportNumber) {
        console.log(`   Passport: ${traveller.passportNumber} (Expires: ${traveller.passportExpiry?.toDateString()})`);
      }
      if (traveller.customerId) {
        console.log(`   Associated with customer: ${(traveller.customerId as any)?.name}`);
      }
    }
    
    console.log('\n=== Testing Filters ===');
    
    // Test active travellers
    const activeTravellers = await Traveller.find({ 
      businessId: business._id, 
      isDeleted: false 
    });
    console.log(`Active travellers: ${activeTravellers.length}`);
    
    // Test soft delete
    const firstTraveller = createdTravellers[0];
    await Traveller.findByIdAndUpdate(firstTraveller._id, { isDeleted: true });
    console.log(`Soft deleted: ${firstTraveller.name}`);
    
    // Test deleted filter
    const deletedTravellers = await Traveller.find({ 
      businessId: business._id, 
      isDeleted: true 
    });
    console.log(`Deleted travellers: ${deletedTravellers.length}`);
    
    // Test customer filter
    if (customer) {
      const customerTravellers = await Traveller.find({ 
        businessId: business._id, 
        customerId: customer._id,
        isDeleted: false
      });
      console.log(`Travellers for customer ${customer.name}: ${customerTravellers.length}`);
    }
    
    console.log('\n✅ Traveller API test completed successfully!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error testing traveller API:', error);
    await mongoose.disconnect();
  }
};

testTravellerAPI();
