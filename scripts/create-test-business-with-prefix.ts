import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Business from '../models/Business';
import User from '../models/User';
import Customer from '../models/Customer';
import Quotation from '../models/Quotation';
import bcrypt from 'bcrypt';

configDotenv();

const createTestBusinessWithPrefix = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Create a new test business with custom prefix
    const businessData = {
      businessName: 'Karvaan Experiences',
      businessType: 'travel_agency',
      email: 'admin@karvaanexperiences.com',
      phone: '+91-9876543210',
      address: {
        street: '123 Travel Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400001'
      },
      quotationPrefix: 'KVN', // Custom prefix as requested
      description: 'Premium travel experiences company',
      adminUserId: new mongoose.Types.ObjectId() // Temporary, will update after creating user
    };
    
    // Create the business first
    const business = new Business(businessData);
    
    // Create admin user for this business
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const adminUser = new User({
      name: 'Karvaan Admin',
      email: 'admin@karvaanexperiences.com',
      password: hashedPassword,
      businessId: business._id,
      userType: 'business_admin',
      isActive: true
    });
    
    // Update business with correct admin user ID
    business.adminUserId = adminUser._id;
    
    // Save both
    await business.save();
    await adminUser.save();
    
    console.log(`✅ Created business: ${business.businessName} with prefix: ${business.quotationPrefix}`);
    
    // Create a test customer for this business
    const customer = new Customer({
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91-9876543211',
      businessId: business._id,
      address: {
        street: '456 Customer Lane',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        zipCode: '110001'
      }
    });
    
    await customer.save();
    console.log(`✅ Created customer: ${customer.name}`);
    
    // Create test quotations for this business
    const quotations = [
      {
        quotationType: 'flight' as const,
        channel: 'B2C' as const,
        partyId: customer._id,
        partyModel: 'Customer' as const,
        businessId: business._id,
        formFields: new Map([
          ['destination', 'Goa'],
          ['departure', 'Mumbai'],
          ['passengers', '2']
        ]),
        totalAmount: 18000,
        status: 'draft' as const
      },
      {
        quotationType: 'hotel' as const,
        channel: 'B2B' as const,
        partyId: customer._id,
        partyModel: 'Customer' as const,
        businessId: business._id,
        formFields: new Map([
          ['hotel', 'Beach Resort'],
          ['nights', '4'],
          ['rooms', '1']
        ]),
        totalAmount: 32000,
        status: 'confirmed' as const
      }
    ];
    
    console.log('\n=== Creating Quotations for Karvaan Experiences ===');
    for (let i = 0; i < quotations.length; i++) {
      const quotation = new Quotation(quotations[i]);
      await quotation.save();
      console.log(`${i + 1}. Created quotation: ${quotation.customId} (Amount: ₹${quotation.totalAmount})`);
    }
    
    // Show all quotations from both businesses
    console.log('\n=== All Quotations by Business ===');
    const allBusinesses = await Business.find({});
    
    for (const biz of allBusinesses) {
      const bizQuotations = await Quotation.find({ businessId: biz._id }).sort({ createdAt: 1 });
      console.log(`\n${biz.businessName} (${biz.quotationPrefix}):`);
      bizQuotations.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.customId} - ${q.quotationType} (₹${q.totalAmount})`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error creating test business:', error);
    await mongoose.disconnect();
  }
};

createTestBusinessWithPrefix();
