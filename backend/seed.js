require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Employee = require("./models/Employee");
const Pod = require("./models/Pod");
const Brand = require("./models/Brand");
const Process = require("./models/Process");
const Assignment = require("./models/Assignment");
const WorkingRule = require("./models/WorkingRule");
const Leave = require("./models/Leave");
const Roster = require("./models/Roster");
const Holiday = require("./models/Holiday");

// ========================================
// EMPLOYEE DATA
// ========================================

const employeesData = [
  // Customer Support
  ["EMP001", "Rahul Sharma", "rahul@gmail.com", "9876500001", "Pod Lead", "Sunday", "POD001"],
  ["EMP002", "Priya Patel", "priya@gmail.com", "9876500002", "Team Member", "Monday", "POD001"],
  ["EMP003", "Amit Verma", "amit@gmail.com", "9876500003", "Team Member", "Tuesday", "POD001"],
  ["EMP004", "Sneha Joshi", "sneha@gmail.com", "9876500004", "Team Member", "Wednesday", "POD001"],
  ["EMP005", "Karan Mehta", "karan@gmail.com", "9876500005", "Team Member", "Thursday", "POD001"],
  ["EMP006", "Neha Singh", "neha@gmail.com", "9876500006", "Team Member", "Friday", "POD001"],
  ["EMP007", "Arjun Rao", "arjun@gmail.com", "9876500007", "Team Member", "Saturday", "POD001"],
  ["EMP008", "Pooja Shah", "pooja@gmail.com", "9876500008", "Team Member", "Sunday", "POD001"],
  ["EMP009", "Rohit Kumar", "rohit@gmail.com", "9876500009", "Team Member", "Monday", "POD001"],

  // Sales Operations
  ["EMP010", "Anjali Desai", "anjali@gmail.com", "9876500010", "Pod Lead", "Sunday", "POD002"],
  ["EMP011", "Vikram Shah", "vikram@gmail.com", "9876500011", "Team Member", "Monday", "POD002"],
  ["EMP012", "Sahil Mehta", "sahil@gmail.com", "9876500012", "Team Member", "Tuesday", "POD002"],
  ["EMP013", "Isha Kulkarni", "isha@gmail.com", "9876500013", "Team Member", "Wednesday", "POD002"],
  ["EMP014", "Aditya Nair", "aditya@gmail.com", "9876500014", "Team Member", "Thursday", "POD002"],
  ["EMP015", "Riya Kapoor", "riya@gmail.com", "9876500015", "Team Member", "Friday", "POD002"],
  ["EMP016", "Manish Gupta", "manish@gmail.com", "9876500016", "Team Member", "Saturday", "POD002"],
  ["EMP017", "Kavya Reddy", "kavya@gmail.com", "9876500017", "Team Member", "Sunday", "POD002"],
  ["EMP018", "Akash Patil", "akash@gmail.com", "9876500018", "Team Member", "Monday", "POD002"],

  // Order Management
  ["EMP019", "Varun Malhotra", "varun@gmail.com", "9876500019", "Pod Lead", "Sunday", "POD003"],
  ["EMP020", "Simran Kaur", "simran@gmail.com", "9876500020", "Team Member", "Monday", "POD003"],
  ["EMP021", "Deepak Yadav", "deepak@gmail.com", "9876500021", "Team Member", "Tuesday", "POD003"],
  ["EMP022", "Nisha Jain", "nisha@gmail.com", "9876500022", "Team Member", "Wednesday", "POD003"],
  ["EMP023", "Harsh Agarwal", "harsh@gmail.com", "9876500023", "Team Member", "Thursday", "POD003"],
  ["EMP024", "Meera Iyer", "meera@gmail.com", "9876500024", "Team Member", "Friday", "POD003"],
  ["EMP025", "Saurabh Mishra", "saurabh@gmail.com", "9876500025", "Team Member", "Saturday", "POD003"],
  ["EMP026", "Tanvi Deshmukh", "tanvi@gmail.com", "9876500026", "Team Member", "Sunday", "POD003"],
  ["EMP027", "Rohan Kulkarni", "rohan@gmail.com", "9876500027", "Team Member", "Monday", "POD003"],

  // Customer Care
  ["EMP028", "Akshay Joshi", "akshay@gmail.com", "9876500028", "Pod Lead", "Sunday", "POD004"],
  ["EMP029", "Diya Shah", "diya@gmail.com", "9876500029", "Team Member", "Monday", "POD004"],
  ["EMP030", "Yash Thakur", "yash@gmail.com", "9876500030", "Team Member", "Tuesday", "POD004"],
  ["EMP031", "Ayesha Khan", "ayesha@gmail.com", "9876500031", "Team Member", "Wednesday", "POD004"],
  ["EMP032", "Siddharth Rao", "siddharth@gmail.com", "9876500032", "Team Member", "Thursday", "POD004"],
  ["EMP033", "Ananya Bose", "ananya@gmail.com", "9876500033", "Team Member", "Friday", "POD004"],
  ["EMP034", "Mohit Sinha", "mohit@gmail.com", "9876500034", "Team Member", "Saturday", "POD004"],
  ["EMP035", "Kriti Sharma", "kriti@gmail.com", "9876500035", "Team Member", "Sunday", "POD004"],
  ["EMP036", "Raj Malhotra", "raj@gmail.com", "9876500036", "Team Member", "Monday", "POD004"],
];

// ========================================
// MAIN SEED FUNCTION
// ========================================

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("\nConnected to MongoDB");

    // ====================================
    // STEP 1: DELETE EXISTING DATA
    // ====================================

    console.log("\nDeleting existing records...");

    await Promise.all([
      Assignment.deleteMany({}),
      WorkingRule.deleteMany({}),
      Leave.deleteMany({}),
      Roster.deleteMany({}),
      Holiday.deleteMany({}),
      Employee.deleteMany({}),
      Pod.deleteMany({}),
      Brand.deleteMany({}),
      Process.deleteMany({}),
    ]);

    console.log("Existing records deleted successfully!");

    // ====================================
    // STEP 2: CREATE EMPLOYEES
    // ====================================

    const employeeMap = {};

    for (const data of employeesData) {
      const [
        employeeCode,
        name,
        email,
        phone,
        role,
        weeklyOff,
      ] = data;

      const employee = await Employee.create({
        employeeCode,
        name,
        email,
        phone,
        role,
        weeklyOff,
        status: "Active",
        pod: null,
      });

      employeeMap[employeeCode] = employee;
    }

    console.log("36 employees created");

    // ====================================
    // STEP 3: CREATE PODS
    // ====================================

    const podsData = [
      {
        code: "POD001",
        name: "Customer Support",
        lead: "EMP001",
        description: "Handles customer queries and support.",
      },
      {
        code: "POD002",
        name: "Sales Operations",
        lead: "EMP010",
        description: "Handles sales and order-related operations.",
      },
      {
        code: "POD003",
        name: "Order Management",
        lead: "EMP019",
        description: "Handles order processing and management.",
      },
      {
        code: "POD004",
        name: "Customer Care",
        lead: "EMP028",
        description: "Handles customer care and service requests.",
      },
    ];

    const podMap = {};

    for (const podData of podsData) {
      const pod = await Pod.create({
        name: podData.name,
        code: podData.code,
        lead: employeeMap[podData.lead]._id,
        description: podData.description,
        status: "Active",
      });

      podMap[podData.code] = pod;
    }

    // Assign employees to pods
    for (const data of employeesData) {
      const employeeCode = data[0];
      const podCode = data[6];

      await Employee.findByIdAndUpdate(
        employeeMap[employeeCode]._id,
        { pod: podMap[podCode]._id }
      );
    }

    console.log("4 pods created and employees assigned");

    // ====================================
    // STEP 4: CREATE BRANDS
    // ====================================

    const brandsData = [
      {
        code: "BR001",
        name: "Amazon",
        manager: "EMP001",
      },
      {
        code: "BR002",
        name: "Flipkart",
        manager: "EMP010",
      },
    ];

    const brandMap = {};

    for (const brandData of brandsData) {
      const brand = await Brand.create({
        name: brandData.name,
        code: brandData.code,
        industry: "E-commerce",
        manager: employeeMap[brandData.manager]._id,
        description: `${brandData.name} operations team`,
        status: "Active",
      });

      brandMap[brandData.code] = brand;
    }

    console.log("2 brands created");

    // ====================================
    // STEP 5: CREATE PROCESSES
    // ====================================

    const processesData = [
      {
        code: "PR001",
        name: "Customer Support",
        category: "Customer Service",
        brand: "BR001",
        pod: "POD001",
      },
      {
        code: "PR002",
        name: "Order Management",
        category: "Operations",
        brand: "BR001",
        pod: "POD003",
      },
      {
        code: "PR003",
        name: "Sales Support",
        category: "Sales",
        brand: "BR002",
        pod: "POD002",
      },
      {
        code: "PR004",
        name: "Customer Care",
        category: "Customer Service",
        brand: "BR002",
        pod: "POD004",
      },
    ];

    const processMap = {};

    for (const processData of processesData) {
      const process = await Process.create({
        name: processData.name,
        code: processData.code,
        category: processData.category,
        brand: brandMap[processData.brand]._id,
        description: `${processData.name} process`,
        status: "Active",
      });

      processMap[processData.code] = {
        ...processData,
        document: process,
      };
    }

    console.log("4 processes created");

    // ====================================
    // STEP 6: CREATE ASSIGNMENTS
    // ====================================

    for (const data of employeesData) {
      const employeeCode = data[0];
      const podCode = data[6];

      const matchingProcess = Object.values(processMap).find(
        (process) => process.pod === podCode
      );

      await Assignment.create({
        employee: employeeMap[employeeCode]._id,
        brand: brandMap[matchingProcess.brand]._id,
        process: matchingProcess.document._id,
        pod: podMap[podCode]._id,
        assignedDate: new Date("2026-11-21"),
        status: "Active",
      });
    }

    console.log("36 assignments created");

    // ====================================
    // STEP 7: CREATE WORKING RULES
    // ====================================

    for (const processData of Object.values(processMap)) {
      await WorkingRule.create({
        brand: brandMap[processData.brand]._id,
        process: processData.document._id,
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        minimumStaff: 8,
        publicHolidaysOff: true,
        status: "Active",
      });
    }

    console.log("4 working rules created");

    // ====================================
    // STEP 8: CREATE SAMPLE LEAVES
    // ====================================

    await Leave.create([
      {
        employee: employeeMap["EMP002"]._id,
        leaveType: "Sick",
        startDate: new Date("2026-11-25"),
        endDate: new Date("2026-11-26"),
        reason: "Medical leave",
        status: "Approved",
      },
      {
        employee: employeeMap["EMP006"]._id,
        leaveType: "Annual",
        startDate: new Date("2026-11-27"),
        endDate: new Date("2026-11-28"),
        reason: "Personal leave",
        status: "Pending",
      },
    ]);

    console.log("2 sample leave records created");

    // ====================================
    // FINAL SUMMARY
    // ====================================

    console.log("\n=================================");
    console.log("DATABASE SEEDED SUCCESSFULLY!");
    console.log("=================================");
    console.log("Employees       : 36");
    console.log("Pods            : 4");
    console.log("Brands          : 2");
    console.log("Processes       : 4");
    console.log("Assignments     : 36");
    console.log("Working Rules   : 4");
    console.log("Leaves          : 2");
    console.log("Rosters         : 0");
    console.log("Holidays        : 0");
    console.log("=================================");

  } catch (error) {
    console.error("\nSEED ERROR:", error);

    process.exitCode = 1;

  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
  }
};

seedDatabase();
