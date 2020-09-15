export interface GTFSData {
  routes: { [route_id: string]: Route };
  stops: { [stop_id: string]: Stop };
  calendar: { [service_id: string]: Calendar };
}

/* Server needs to iterate through all trips, client doesn't. */
export interface GTFSDataWithTrips extends GTFSData {
  trips: { [trip_id: string]: Route['route_id'] };
}

export interface CsvCalendar {
  service_id: string;
  monday: '0' | '1';
  tuesday: '0' | '1';
  wednesday: '0' | '1';
  thursday: '0' | '1';
  friday: '0' | '1';
  saturday: '0' | '1';
  sunday: '0' | '1';
  start_date: string;
  end_date: string;
}

export interface Calendar extends CsvCalendar {
  days: readonly [
    sunday: boolean,
    monday: boolean,
    tuesday: boolean,
    wednesday: boolean,
    thursday: boolean,
    friday: boolean,
    saturday: boolean,
  ];
  text_name: string;
}

export interface CsvRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
  agency_id: string;
  route_url: string;
}

export interface Route extends CsvRoute {
  trips: { [trip_id: string]: Trip };
}

export interface CsvTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  direction_id: string;
  trip_short_name: string;
  trip_headsign: string;
  shape_id: string;
}

export interface Trip extends CsvTrip {
  stop_times: { [stop_sequence: number]: StopTime };
}

export interface CsvStop {
  stop_id: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
}

export interface Stop extends CsvStop {
  trips: {
    trip: Trip['trip_id'];
    dir: string;
    route: Route['route_id'];
    sequence: number;
    time: string;
  }[];
  routes: Route['route_id'][];
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
}