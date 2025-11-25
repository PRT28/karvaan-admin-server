import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Business from '../models/Business';

configDotenv();

const updateBusinessPrefixes = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    
    // Get all businesses
    const businesses = await Business.find({});
    console.log(`Found ${businesses.length} businesses to update`);
    
    for (const business of businesses) {
      // Generate a prefix from business name if not already set
      if (!business.quotationPrefix) {
        // Extract first few letters from business name and convert to uppercase
        let prefix = business.businessName
          .replace(/[^a-zA-Z]/g, '') // Remove non-alphabetic characters
          .substring(0, 3) // Take first 3 characters
          .toUpperCase();
        
        // If prefix is too short, pad with 'X'
        if (prefix.length < 2) {
          prefix = prefix.padEnd(3, 'X');
        }
        
        // Check if prefix already exists
        let counter = 1;
        let finalPrefix = prefix;
        while (await Business.findOne({ quotationPrefix: finalPrefix, _id: { $ne: business._id } })) {
          finalPrefix = prefix + counter;
          counter++;
          // Ensure prefix doesn't exceed 5 characters
          if (finalPrefix.length > 5) {
            finalPrefix = prefix.substring(0, 3) + counter;
          }
        }
        
        business.quotationPrefix = finalPrefix;
        await business.save();
        console.log(`Updated ${business.businessName} with prefix: ${finalPrefix}`);
      } else {
        console.log(`${business.businessName} already has prefix: ${business.quotationPrefix}`);
      }
    }
    
    console.log('\n✅ All businesses updated with quotation prefixes!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error updating business prefixes:', error);
    await mongoose.disconnect();
  }
};

updateBusinessPrefixes();
