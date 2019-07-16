const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const { safeDump } = require('js-yaml');
const { writeFileSync } = require('fs');
const { stringify } = require('qs');
const { uniq, keyBy } = require('lodash');
const { EVENTBRITE_OATH_TOKEN } = process.env;
const headers = {
  'Authorization': `Bearer ${EVENTBRITE_OATH_TOKEN}`,
  'Accept': 'application/json'
}
let venues;

const fetchEvents = async () => {
  try {
    const eventsJson = (await (
      await fetch(`https://www.eventbriteapi.com/v3/organizations/178296646722/events/?${stringify({
        order_by: 'start_asc',
        time_filter: 'current_future',
        status: 'live'
      })}`, { headers })).json()
    ).events;
    const austinEvents = eventsJson.filter(event => event.organizer_id === '10937668459' && event.listed);
    const lubbockEvents = eventsJson.filter(event => event.organizer_id === '18046524539' && event.listed);
    console.log(`Found ${austinEvents.length} Austin events.`)
    console.log(`Found ${lubbockEvents.length} Lubbock events.`)
    venues = await Promise.all(uniq(eventsJson.map(event => event.venue_id)).map(venueId =>
      fetch(`https://www.eventbriteapi.com/v3/venues/${venueId}`, { headers })
    ));

    venues = await Promise.all(venues.map(venue => venue.json()))
    console.log(`Fetched ${venues.length} venues.`)
    venues = keyBy(venues, 'id');

    const events = {
      austin: austinEvents.map(event => parseEvent(event)),
      lubbock: lubbockEvents.map(event => parseEvent(event))
    };

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
  height: event.logo && event.logo.crop_mask.height,
  width: event.logo && event.logo.crop_mask.width,
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
