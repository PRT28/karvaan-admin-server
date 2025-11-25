import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import Business from '../models/Business';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Team from '../models/Team';
import Logs from '../models/Logs';
import Quotation from '../models/Quotation';
import { Sale } from '../models/Sale';

configDotenv();

const migrateDataToBusiness = async () => {
  try {
    console.log('🚀 Starting data migration to business model...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL as string);
    console.log('✅ Connected to MongoDB');

    // Get all businesses
    const businesses = await Business.find();
    console.log(`📊 Found ${businesses.length} businesses`);

    if (businesses.length === 0) {
      console.log('❌ No businesses found. Please create businesses first.');
      return;
    }

    // Use the first business as default for existing data
    const defaultBusiness = businesses[0];
    console.log(`🏢 Using default business: ${defaultBusiness.businessName} (${defaultBusiness._id})`);

    let migrationSummary = {
      customers: { updated: 0, total: 0 },
      vendors: { updated: 0, total: 0 },
      teams: { updated: 0, total: 0 },
      logs: { updated: 0, total: 0 },
      quotations: { updated: 0, total: 0 },
      sales: { updated: 0, total: 0 }
    };

    // Migrate Customers
    console.log('\n📋 Migrating Customers...');
    const customersWithoutBusiness = await Customer.find({ businessId: { $exists: false } });
    migrationSummary.customers.total = customersWithoutBusiness.length;
    
    for (const customer of customersWithoutBusiness) {
      await Customer.findByIdAndUpdate(customer._id, { businessId: defaultBusiness._id });
      migrationSummary.customers.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.customers.updated} customers`);

    // Migrate Vendors
    console.log('\n🏭 Migrating Vendors...');
    const vendorsWithoutBusiness = await Vendor.find({ businessId: { $exists: false } });
    migrationSummary.vendors.total = vendorsWithoutBusiness.length;
    
    for (const vendor of vendorsWithoutBusiness) {
      await Vendor.findByIdAndUpdate(vendor._id, { businessId: defaultBusiness._id });
      migrationSummary.vendors.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.vendors.updated} vendors`);

    // Migrate Teams
    console.log('\n👥 Migrating Teams...');
    const teamsWithoutBusiness = await Team.find({ businessId: { $exists: false } });
    migrationSummary.teams.total = teamsWithoutBusiness.length;
    
    for (const team of teamsWithoutBusiness) {
      await Team.findByIdAndUpdate(team._id, { businessId: defaultBusiness._id });
      migrationSummary.teams.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.teams.updated} teams`);

    // Migrate Logs
    console.log('\n📝 Migrating Logs...');
    const logsWithoutBusiness = await Logs.find({ businessId: { $exists: false } });
    migrationSummary.logs.total = logsWithoutBusiness.length;
    
    for (const log of logsWithoutBusiness) {
      await Logs.findByIdAndUpdate(log._id, { businessId: defaultBusiness._id });
      migrationSummary.logs.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.logs.updated} logs`);

    // Migrate Quotations
    console.log('\n💰 Migrating Quotations...');
    const quotationsWithoutBusiness = await Quotation.find({ businessId: { $exists: false } });
    migrationSummary.quotations.total = quotationsWithoutBusiness.length;
    
    for (const quotation of quotationsWithoutBusiness) {
      // Try to get businessId from the party (Customer or Vendor)
      let businessId = defaultBusiness._id;
      
      if (quotation.partyModel === 'Customer') {
        const customer = await Customer.findById(quotation.partyId);
        if (customer && customer.businessId) {
          businessId = customer.businessId;
        }
      } else if (quotation.partyModel === 'Vendor') {
        const vendor = await Vendor.findById(quotation.partyId);
        if (vendor && vendor.businessId) {
          businessId = vendor.businessId;
        }
      }
      
      await Quotation.findByIdAndUpdate(quotation._id, { businessId });
      migrationSummary.quotations.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.quotations.updated} quotations`);

    // Migrate Sales
    console.log('\n💳 Migrating Sales...');
    const salesWithoutBusiness = await Sale.find({ businessId: { $exists: false } });
    migrationSummary.sales.total = salesWithoutBusiness.length;
    
    for (const sale of salesWithoutBusiness) {
      // Try to get businessId from the quotation
      let businessId = defaultBusiness._id;
      
      if (sale.quotation) {
        const quotation = await Quotation.findById(sale.quotation);
        if (quotation && quotation.businessId) {
          businessId = quotation.businessId;
        }
      }
      
      await Sale.findByIdAndUpdate(sale._id, { businessId });
      migrationSummary.sales.updated++;
    }
    console.log(`✅ Updated ${migrationSummary.sales.updated} sales`);

    // Print migration summary
    console.log('\n📊 Migration Summary:');
    console.log('====================');
    console.log(`Customers: ${migrationSummary.customers.updated}/${migrationSummary.customers.total} updated`);
    console.log(`Vendors: ${migrationSummary.vendors.updated}/${migrationSummary.vendors.total} updated`);
    console.log(`Teams: ${migrationSummary.teams.updated}/${migrationSummary.teams.total} updated`);
    console.log(`Logs: ${migrationSummary.logs.updated}/${migrationSummary.logs.total} updated`);
    console.log(`Quotations: ${migrationSummary.quotations.updated}/${migrationSummary.quotations.total} updated`);
    console.log(`Sales: ${migrationSummary.sales.updated}/${migrationSummary.sales.total} updated`);

    const totalUpdated = Object.values(migrationSummary).reduce((sum, item) => sum + item.updated, 0);
    const totalRecords = Object.values(migrationSummary).reduce((sum, item) => sum + item.total, 0);
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📈 Total records updated: ${totalUpdated}/${totalRecords}`);
    console.log(`🏢 Default business used: ${defaultBusiness.businessName}`);

    if (totalRecords === 0) {
      console.log('ℹ️  No records needed migration - all data already has business associations.');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
if (require.main === module) {
  migrateDataToBusiness();
}

export default migrateDataToBusiness;
