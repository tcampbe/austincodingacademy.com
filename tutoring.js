const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const { safeDump } = require('js-yaml');
const { writeFileSync } = require('fs');
const { ACUITY_USER_ID, ACUITY_API_KEY } = process.env;

const acuityApiUrl = `https://${ACUITY_USER_ID}:${ACUITY_API_KEY}@acuityscheduling.com/api/v1`;

const fetchTutoringTimes = async () => {
  try {
    let response = await fetch(`${acuityApiUrl}/appointment-types`);
    const appointmentTypes = await response.json();
    const tutoringAppointmentTypes = appointmentTypes.filter(type => type.category === 'Tutoring');
    console.log('tutoringAppointmentTypes', tutoringAppointmentTypes);
    console.log('tutoringAppointmentTypes.length', tutoringAppointmentTypes.length);
    const thisMonth = DateTime.local().toFormat('yyyy-LL');
    const nextMonth = DateTime.local().plus({ months: 1 }).toFormat('yyyy-LL');
    for (let i = 0; i < tutoringAppointmentTypes.length; i++) {
      console.log('fetching dates for', tutoringAppointmentTypes[i].name);
      response = await fetch(`${acuityApiUrl}/availability/dates?appointmentTypeID=${tutoringAppointmentTypes[i].id}&month=${thisMonth}&timezone=America/Chicago`);
      let availableDates = await response.json();
      tutoringAppointmentTypes[i].availableDates = availableDates;
      response = await fetch(`${acuityApiUrl}/availability/dates?appointmentTypeID=${tutoringAppointmentTypes[i].id}&month=${nextMonth}&timezone=America/Chicago`);
      availableDates = await response.json();
      tutoringAppointmentTypes[i].availableDates = [
        ...tutoringAppointmentTypes[i].availableDates,
        ...availableDates
      ];
      for (let j = 0; j < tutoringAppointmentTypes[i].availableDates.length; j++) {
        console.log('fetching times for', tutoringAppointmentTypes[i].availableDates[j].date);
        response = await fetch(`${acuityApiUrl}/availability/times?appointmentTypeID=${tutoringAppointmentTypes[i].id}&date=${tutoringAppointmentTypes[i].availableDates[j].date}&timezone=America/Chicago`);
        const availableTimes = await response.json();
        tutoringAppointmentTypes[i].availableDates[j].availableTimes = availableTimes;
      }
    }
    writeFileSync('_data/tutors.yml', safeDump((tutoringAppointmentTypes)));
  } catch (error) {
    console.error('error', error);
  }
}

fetchTutoringTimes();