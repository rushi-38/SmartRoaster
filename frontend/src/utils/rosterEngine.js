// Generate Monthly Roster
export const generateRoster = ({
  employees,
  assignments,
  processRules,
  approvedLeaves,
  publicHolidays,
  year,
  month,
}) => {
  const roster = [];
  const conflicts = [];

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    const weekday = new Date(year, month, day).getDay();

    const dailyAllocations = [];
    const assignedEmployees = new Set();

    processRules.forEach((rule) => {
      if (!rule.workingDays.includes(weekday)) return;
      if (publicHolidays.includes(date)) return;

      const eligibleAssignments = assignments.filter(
        (assignment) =>
          assignment.brand === rule.brand &&
          assignment.process === rule.process
      );

      const availableEmployees = [];

      eligibleAssignments.forEach((assignment) => {
        const employee = employees.find(
          (emp) => emp.id === assignment.employeeId
        );

        if (!employee || !employee.active) return;
        if (employee.weeklyOff === weekday) return;

        const isOnLeave = approvedLeaves.some(
          (leave) =>
            leave.employeeId === employee.id &&
            leave.date === date &&
            leave.status === "Approved"
        );

        if (isOnLeave) return;
        if (assignedEmployees.has(employee.id)) return;

        availableEmployees.push(employee);
      });

      const allocatedEmployees = availableEmployees.slice(
        0,
        rule.minimumStaff
      );

      allocatedEmployees.forEach((employee) => {
        assignedEmployees.add(employee.id);

        dailyAllocations.push({
          date,
          employeeId: employee.id,
          employeeName: employee.name,
          brand: rule.brand,
          process: rule.process,
          status: "Working",
        });
      });

      if (allocatedEmployees.length < rule.minimumStaff) {
        conflicts.push({
          date,
          brand: rule.brand,
          process: rule.process,
          type: "STAFF_SHORTAGE",
          required: rule.minimumStaff,
          available: allocatedEmployees.length,
          message: `Required ${rule.minimumStaff} employee(s), but only ${allocatedEmployees.length} could be allocated.`,
        });
      }
    });

    roster.push({
      date,
      allocations: dailyAllocations,
    });
  }

  return {
    roster,
    conflicts,
    totalDays: daysInMonth,
    totalConflicts: conflicts.length,
  };
};


// Validate Manual Employee Replacement
export const validateReplacement = ({
  allocation,
  newEmployee,
  roster,
  assignments,
  processRules,
  approvedLeaves,
  publicHolidays,
}) => {
  const date = allocation.date;

  const [, month, day] = date.split("-").map(Number);
  const year = Number(date.split("-")[0]);

  const weekday = new Date(year, month - 1, day).getDay();

  if (!newEmployee || !newEmployee.active) {
    return "Employee is not active.";
  }

  const hasAssignment = assignments.some(
    (assignment) =>
      assignment.employeeId === newEmployee.id &&
      assignment.brand === allocation.brand &&
      assignment.process === allocation.process
  );

  if (!hasAssignment) {
    return "Employee is not assigned to this brand and process.";
  }

  const rule = processRules.find(
    (item) =>
      item.brand === allocation.brand &&
      item.process === allocation.process
  );

  if (!rule || !rule.workingDays.includes(weekday)) {
    return "This process does not operate on the selected date.";
  }

  if (publicHolidays.includes(date)) {
    return "Cannot assign an employee on a public holiday.";
  }

  if (newEmployee.weeklyOff === weekday) {
    return "Employee has a weekly off on this date.";
  }

  const isOnLeave = approvedLeaves.some(
    (leave) =>
      leave.employeeId === newEmployee.id &&
      leave.date === date &&
      leave.status === "Approved"
  );

  if (isOnLeave) {
    return "Employee has approved leave on this date.";
  }

  const currentDay = roster.find((item) => item.date === date);

  const alreadyAllocated = currentDay?.allocations.some(
    (item) =>
      item.employeeId === newEmployee.id &&
      !(
        item.employeeId === allocation.employeeId &&
        item.brand === allocation.brand &&
        item.process === allocation.process
      )
  );

  if (alreadyAllocated) {
    return "Employee is already allocated to another process on this date.";
  }

  return null;
};


// Recalculate Staffing Conflicts
export const recalculateConflicts = ({
  roster,
  processRules,
  publicHolidays,
  year,
  month,
}) => {
  const conflicts = [];

  roster.forEach((day) => {
    const [, monthNumber, dayNumber] = day.date.split("-").map(Number);

    const weekday = new Date(
      year,
      monthNumber - 1,
      dayNumber
    ).getDay();

    if (publicHolidays.includes(day.date)) return;

    processRules.forEach((rule) => {
      if (!rule.workingDays.includes(weekday)) return;

      const available = day.allocations.filter(
        (allocation) =>
          allocation.brand === rule.brand &&
          allocation.process === rule.process
      ).length;

      if (available < rule.minimumStaff) {
        conflicts.push({
          date: day.date,
          brand: rule.brand,
          process: rule.process,
          type: "STAFF_SHORTAGE",
          required: rule.minimumStaff,
          available,
          message: `Required ${rule.minimumStaff} employee(s), but only ${available} could be allocated.`,
        });
      }
    });
  });

  return conflicts;
};