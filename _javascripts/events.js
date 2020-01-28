const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const { safeDump } = require('js-yaml');
const { readFileSync, writeFileSync } = require('fs');
const { stringify } = require('qs');
const { uniq, keyBy } = require('lodash');
const fm = require('front-matter');
const { EVENTBRITE_OATH_TOKEN } = process.env;
const headers = {
  'Authorization': `Bearer ${EVENTBRITE_OATH_TOKEN}`,
  'Accept': 'application/json'
}
let venues = [];

const fetchEvents = async () => {
  try {
    const eventsJson = (await (
      await fetch(`https://www.eventbriteapi.com/v3/organizations/178296646722/events/?${stringify({
        order_by: 'start_asc',
        time_filter: 'current_future',
        status: 'live'
      })}`, { headers })).json()
    ).events;

    const uniqueVenues = uniq(eventsJson.map(event => event.venue_id)).filter(venueId => venueId);
    for (let i = 0; i < uniqueVenues.length; i++) {
      const venue = await (await fetch(`https://www.eventbriteapi.com/v3/venues/${uniqueVenues[i]}`, { headers })).json();
      venues.push(venue)
    }

    console.log(`Fetched ${venues.length} venues.`)
    venues = keyBy(venues, 'id');
    const events = {};
    const schools = fm(readFileSync('./settings.html', 'utf-8')).attributes.schools
    .filter(school => school.eventbrite_id)
    .map(school => ({ key: school.key, eventbriteId: school.eventbrite_id }));
    schools.forEach(school => {
      events[school.key] = eventsJson
        .filter(event => event.organizer_id === school.eventbriteId && event.listed)
        .map(event => parseEvent(event))
    })
    writeFileSync('_data/events.yml', safeDump(events));
  } catch (error) {
    console.error(error);
  }
}

const parseEvent = event => ({
  name: event.name.text,
  description: event.description.text,
  url: event.url,
  start_date: DateTime.fromISO(event.start.local).toFormat('ccc, LLL d'),
  start_time: DateTime.fromISO(event.start.local).toFormat('h:mm a'),
  end_date: DateTime.fromISO(event.start.local).toFormat('ccc, LLL d'),
  end_time: DateTime.fromISO(event.start.local).toFormat('h:mm a'),
  start_date_time: event.start.local,
  published_date_time: event.published,
  end_date_time: event.end.local,
  img: event.logo && event.logo.url,
  height: event.logo && event.logo.crop_mask && event.logo.crop_mask.height,
  width: event.logo && event.logo.crop_mask && event.logo.crop_mask.width,
  ...venues[event.venue_id] ? {
    venue_name: venues[event.venue_id].name,
    venue_address: [venues[event.venue_id].address.address_1, venues[event.venue_id].address.address_2].filter(x => x).join(', '),
    venue_city: venues[event.venue_id].address.city,
    venue_state: venues[event.venue_id].address.region,
    venue_zip: venues[event.venue_id].address.postal_code,
    venue_country: venues[event.venue_id].address.country
  } : {}
});

fetchEvents();
