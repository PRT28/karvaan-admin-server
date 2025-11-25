import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Quotation from '../models/Quotation';
import Business from '../models/Business';
import Customer from '../models/Customer';

configDotenv();

const testQuotationCustomId = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get a business and customer for testing
    const business = await Business.findOne({});
    const customer = await Customer.findOne({ businessId: business?._id });
    
    if (!business || !customer) {
      console.log('No business or customer found for testing');
      return;
    }
    
    console.log(`Testing with business: ${business.businessName} (Prefix: ${business.quotationPrefix})`);
    console.log(`Using customer: ${customer.name}`);
    
    // Create multiple test quotations to verify auto-increment
    const testQuotations = [
      {
        quotationType: 'flight' as const,
        channel: 'B2C' as const,
        partyId: customer._id,
        partyModel: 'Customer' as const,
        businessId: business._id,
        formFields: new Map([
          ['destination', 'Mumbai'],
          ['departure', 'Delhi'],
          ['passengers', '2']
        ]),
        totalAmount: 25000,
        status: 'draft' as const
      },
      {
        quotationType: 'hotel' as const,
        channel: 'B2B' as const,
        partyId: customer._id,
        partyModel: 'Customer' as const,
        businessId: business._id,
        formFields: new Map([
          ['hotel', 'Taj Hotel'],
          ['nights', '3'],
          ['rooms', '2']
        ]),
        totalAmount: 15000,
        status: 'draft' as const
      },
      {
        quotationType: 'activity' as const,
        channel: 'B2C' as const,
        partyId: customer._id,
        partyModel: 'Customer' as const,
        businessId: business._id,
        formFields: new Map([
          ['activity', 'City Tour'],
          ['duration', '4 hours'],
          ['participants', '4']
        ]),
        totalAmount: 8000,
        status: 'confirmed' as const
      }
    ];
    
    console.log('\n=== Creating Test Quotations ===');
    
    for (let i = 0; i < testQuotations.length; i++) {
      const quotation = new Quotation(testQuotations[i]);
      await quotation.save();
      
      console.log(`${i + 1}. Created quotation with Custom ID: ${quotation.customId}`);
      console.log(`   Type: ${quotation.quotationType}, Amount: ₹${quotation.totalAmount}`);
    }
    
    // Verify the quotations were created with correct custom IDs
    console.log('\n=== Verifying Created Quotations ===');
    const createdQuotations = await Quotation.find({ businessId: business._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    createdQuotations.forEach((quotation, index) => {
      console.log(`${index + 1}. Custom ID: ${quotation.customId}`);
      console.log(`   MongoDB ID: ${quotation._id}`);
      console.log(`   Type: ${quotation.quotationType}, Status: ${quotation.status}`);
    });
    
    console.log('\n✅ Custom ID generation test completed successfully!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error testing quotation custom ID:', error);
    await mongoose.disconnect();
  }
};

testQuotationCustomId();
