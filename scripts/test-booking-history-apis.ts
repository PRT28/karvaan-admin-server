import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Vendor from '../models/Vendors';
import Traveller from '../models/Traveller';
import Quotation from '../models/Quotation';
import Business from '../models/Business';
import Team from '../models/Team';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karvaan-admin';

async function testBookingHistoryAPIs() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find existing business for testing
    const business = await Business.findOne();
    if (!business) {
      console.log('❌ No business found. Please create a business first.');
      return;
    }
    console.log(`📊 Using business: ${business.businessName} (${business._id})`);

    // Find existing team member for owner
    const teamMember = await Team.findOne({ businessId: business._id });
    if (!teamMember) {
      console.log('❌ No team member found. Please create a team member first.');
      return;
    }
    console.log(`👤 Using team member: ${teamMember.name} (${teamMember._id})`);

    // Create test customer
    console.log('\n📝 Creating test customer...');
    const testCustomer = new Customer({
      name: 'John Doe',
      email: 'john.doe.booking.test@example.com',
      phone: '+1234567890',
      companyName: 'Doe Enterprises',
      businessId: business._id,
      ownerId: teamMember._id,
      tier: 'tier1',
      isDeleted: false,
      isDeletable: true
    });
    await testCustomer.save();
    console.log(`✅ Created customer: ${testCustomer.name} (${testCustomer._id})`);

    // Create test vendor
    console.log('\n📝 Creating test vendor...');
    const testVendor = new Vendor({
      companyName: 'Travel Solutions Ltd',
      contactPerson: 'Jane Smith',
      email: 'jane.smith.booking.test@example.com',
      phone: '+1987654321',
      businessId: business._id,
      tier: 'tier2',
      isDeleted: false
    });
    await testVendor.save();
    console.log(`✅ Created vendor: ${testVendor.companyName} (${testVendor._id})`);

    // Create test traveller
    console.log('\n📝 Creating test traveller...');
    const testTraveller = new Traveller({
      name: 'Alice Johnson',
      email: 'alice.johnson.booking.test@example.com',
      phone: '+1122334455',
      dateOfBirth: new Date('1990-05-15'),
      businessId: business._id,
      ownerId: teamMember._id,
      isDeleted: false
    });
    await testTraveller.save();
    console.log(`✅ Created traveller: ${testTraveller.name} (${testTraveller._id})`);

    // Create test quotations
    console.log('\n📝 Creating test quotations...');
    
    const quotations = [];
    
    // Quotation 1: Customer + Vendor + Traveller
    const quotation1 = new Quotation({
      quotationType: 'flight',
      channel: 'B2C',
      businessId: business._id,
      customerId: testCustomer._id,
      vendorId: testVendor._id,
      travelers: [testTraveller._id],
      formFields: new Map([
        ['destination', 'Paris'],
        ['departure', 'New York']
      ]),
      totalAmount: 1500,
      status: 'confirmed',
      owner: [teamMember._id],
      travelDate: new Date('2024-06-15'),
      adultTravlers: 1,
      childTravlers: 0,
      remarks: 'Business trip to Paris'
    });
    await quotation1.save();
    quotations.push(quotation1);

    // Quotation 2: Same customer, different vendor
    const quotation2 = new Quotation({
      quotationType: 'hotel',
      channel: 'B2B',
      businessId: business._id,
      customerId: testCustomer._id,
      vendorId: testVendor._id,
      travelers: [testTraveller._id],
      formFields: new Map([
        ['hotel', 'Grand Hotel Paris'],
        ['nights', '5']
      ]),
      totalAmount: 800,
      status: 'draft',
      owner: [teamMember._id],
      travelDate: new Date('2024-06-16'),
      adultTravlers: 1,
      childTravlers: 0,
      remarks: 'Hotel booking for Paris trip'
    });
    await quotation2.save();
    quotations.push(quotation2);

    // Quotation 3: Different customer, same vendor and traveller
    const anotherCustomer = new Customer({
      name: 'Bob Wilson',
      email: 'bob.wilson.booking.test@example.com',
      phone: '+1555666777',
      businessId: business._id,
      ownerId: teamMember._id,
      tier: 'tier3',
      isDeleted: false,
      isDeletable: true
    });
    await anotherCustomer.save();

    const quotation3 = new Quotation({
      quotationType: 'activity',
      channel: 'B2C',
      businessId: business._id,
      customerId: anotherCustomer._id,
      vendorId: testVendor._id,
      travelers: [testTraveller._id],
      formFields: new Map([
        ['activity', 'Eiffel Tower Tour'],
        ['duration', '3 hours']
      ]),
      totalAmount: 200,
      status: 'confirmed',
      owner: [teamMember._id],
      travelDate: new Date('2024-06-17'),
      adultTravlers: 1,
      childTravlers: 0,
      remarks: 'Sightseeing tour'
    });
    await quotation3.save();
    quotations.push(quotation3);

    console.log(`✅ Created ${quotations.length} test quotations`);

    // Test queries
    console.log('\n🔍 Testing booking history queries...');

    // Test 1: Customer booking history
    console.log('\n1️⃣ Testing customer booking history...');
    const customerBookings = await Quotation.find({ 
      customerId: testCustomer._id,
      businessId: business._id 
    })
    .populate('customerId', 'name email')
    .populate('vendorId', 'companyName contactPerson')
    .populate('travelers', 'name email');
    
    console.log(`   Found ${customerBookings.length} bookings for customer ${testCustomer.name}`);
    customerBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.quotationType} - ${booking.status} - $${booking.totalAmount}`);
    });

    // Test 2: Vendor booking history
    console.log('\n2️⃣ Testing vendor booking history...');
    const vendorBookings = await Quotation.find({ 
      vendorId: testVendor._id,
      businessId: business._id 
    })
    .populate('customerId', 'name email')
    .populate('vendorId', 'companyName contactPerson')
    .populate('travelers', 'name email');
    
    console.log(`   Found ${vendorBookings.length} bookings for vendor ${testVendor.companyName}`);
    vendorBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.quotationType} - ${booking.status} - $${booking.totalAmount}`);
    });

    // Test 3: Traveller booking history
    console.log('\n3️⃣ Testing traveller booking history...');
    const travellerBookings = await Quotation.find({ 
      travelers: { $in: [testTraveller._id] },
      businessId: business._id 
    })
    .populate('customerId', 'name email')
    .populate('vendorId', 'companyName contactPerson')
    .populate('travelers', 'name email');
    
    console.log(`   Found ${travellerBookings.length} bookings for traveller ${testTraveller.name}`);
    travellerBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.quotationType} - ${booking.status} - $${booking.totalAmount}`);
    });

    console.log('\n✅ All booking history queries completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Customer ${testCustomer.name}: ${customerBookings.length} bookings`);
    console.log(`   - Vendor ${testVendor.companyName}: ${vendorBookings.length} bookings`);
    console.log(`   - Traveller ${testTraveller.name}: ${travellerBookings.length} bookings`);

    console.log('\n🎯 API Endpoints to test:');
    console.log(`   GET /quotation/booking-history/customer/${testCustomer._id}`);
    console.log(`   GET /quotation/booking-history/vendor/${testVendor._id}`);
    console.log(`   GET /quotation/booking-history/traveller/${testTraveller._id}`);

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testBookingHistoryAPIs();
