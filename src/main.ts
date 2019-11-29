/**
 * Contains code to build UI. Interacts with DOM.
 * @author       Tiger Oakes <tigeroakes@gmail.com>
 * @copyright    2014 Tiger Oakes
 */

import { GTFSData, Route, Stop, Trip } from './gtfs-types.js';
import {
    Active,
    ActiveState,
    clickEvent,
    documentLoad,
    dynamicLinkNode,
    getQueryVariable,
    getScheduleData,
    gtfsArrivalToDate,
    gtfsArrivalToString,
    Linkable,
    locateUser,
    LocationUpdate,
    normal,
    nowDateTime,
    openCallbacks,
    placeShape,
    sequence,
    setActiveState,
    stopShape,
    stringTime,
    Type,
    unimportant,
    updateEvent,
    userShape,
    View,
} from './load.js';

let map: google.maps.Map | undefined;
let streetview: google.maps.StreetViewPanorama | undefined;
let autocomplete: google.maps.places.Autocomplete | undefined;
let boundsAllStops: google.maps.LatLngBounds | undefined;
let markers: StopMarker[] = [];
let userMapMarker: LinkableMarker | undefined;
let stopMarker: google.maps.Marker | undefined;

const documentPromise = documentLoad();
const schedulePromise = getScheduleData();
const locatePromise = locateUser(schedulePromise);
let placeMapMarker: LinkableMarker | undefined;
const mapLoaded = loadMap();
if (mapLoaded === false) {
    locatePromise.then(function(position) {
        if (!Active.STOP) openStop(position.stop);
    });
}

type LinkableMarker = google.maps.Marker & Linkable;
interface StopMarker extends LinkableMarker {
    stop_id: string;
    activeInRoute?: boolean;
}

function stopToPos(stop: Stop) {
    return new google.maps.LatLng(
        parseFloat(stop.stop_lat),
        parseFloat(stop.stop_lon),
    );
}

function loadMap() {
    if (
        !navigator.onLine ||
        typeof google !== 'object' ||
        typeof google.maps !== 'object'
    ) {
        console.error('Google Maps API has not loaded');
        documentPromise.then(function() {
            document.body.classList.add('no-map');
        });
        return false;
    }
    boundsAllStops = new google.maps.LatLngBounds();
    markers = [];

    function markersAndLatLng(schedule: GTFSData) {
        return Promise.resolve().then(() => {
            for (const stop of Object.values(schedule.stops)) {
                const marker = new google.maps.Marker({
                    position: stopToPos(stop),
                    title: stop.stop_name,
                    icon: normal,
                }) as StopMarker;
                marker.Type = Type.STOP;
                marker.Value = stop.stop_id;
                marker.stop_id = stop.stop_id;
                google.maps.event.addListener(marker, 'click', clickEvent);
                boundsAllStops!.extend(marker.getPosition()!);
                markers.push(marker);
            }
            return {
                markers: markers,
                bounds: boundsAllStops!,
            };
        });
    }

    function mapLoad() {
        return Promise.resolve().then(() => {
            const mapElement =
                Active.View.STOP === View.MAP_PRIMARY
                    ? document.getElementById('map-canvas')!
                    : document.getElementById('streetview-canvas')!;
            const panoElement =
                Active.View.STOP === View.STREET_PRIMARY
                    ? document.getElementById('map-canvas')!
                    : document.getElementById('streetview-canvas')!;

            map = new google.maps.Map(mapElement, {
                center: new google.maps.LatLng(19.6, -155.56),
                zoom: 10,
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                },
                panControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                },
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                },
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                },
            });

            streetview = new google.maps.StreetViewPanorama(panoElement, {
                position: new google.maps.LatLng(19.723835, -155.084741),
                visible: true,
                pov: { heading: 34, pitch: 0 },
                scrollwheel: false,
                panControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL,
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                addressControl: false,
            });
            map.setStreetView(streetview!);

            autocomplete = new google.maps.places.Autocomplete(
                document.getElementById('search') as HTMLInputElement,
            );
            autocomplete.bindTo('bounds', map);
            google.maps.event.addListener(
                autocomplete,
                'place_changed',
                function() {
                    const place = autocomplete!.getPlace();
                    if (!place.geometry) return;
                    const loc = place.geometry.location;
                    console.log('Lat %s, Lon %s', loc.lat(), loc.lng());
                    locateUser(schedulePromise, {
                        latitude: loc.lat(),
                        longitude: loc.lng(),
                    }).then(position => {
                        if (!placeMapMarker) {
                            placeMapMarker = new google.maps.Marker({
                                position: new google.maps.LatLng(
                                    position.location.latitude,
                                    position.location.longitude,
                                ),
                                title: 'Search Location',
                                icon: placeShape,
                                map: map,
                                animation: google.maps.Animation.DROP,
                                zIndex: 1000,
                            }) as LinkableMarker;
                            placeMapMarker.Type = Type.STOP;
                            google.maps.event.addListener(
                                placeMapMarker,
                                'click',
                                clickEvent,
                            );
                        }
                        placeMapMarker.Value = position.stop;
                        openStop(position.stop);
                    });
                },
            );
            return map;
        });
    }

    Promise.all([
        documentPromise.then(mapLoad),
        schedulePromise.then(markersAndLatLng),
    ]).then(function([map, { markers, bounds }]) {
        map.setCenter(bounds.getCenter());
        map.fitBounds(bounds);
        google.maps.event.addListener(map, 'bounds_changed', function() {
            const mapBounds = map.getBounds()!;
            for (const marker of markers) {
                if (mapBounds.contains(marker.getPosition()!)) {
                    if (marker.getMap() !== map) marker.setMap(map);
                } else {
                    marker.setMap(null);
                }
            }
        });
        markers.forEach(marker => marker.setMap(map));
        locatePromise.then(function(position) {
            userMapMarker = new google.maps.Marker({
                position: new google.maps.LatLng(
                    position.location.latitude,
                    position.location.longitude,
                ),
                title: position.custom ? 'Location of Place' : 'My Location',
                icon: position.custom ? placeShape : userShape,
                map: map,
                animation: google.maps.Animation.DROP,
                zIndex: 1000,
            }) as LinkableMarker;
            userMapMarker.Type = Type.STOP;
            userMapMarker.Value = position.stop;
            google.maps.event.addListener(userMapMarker, 'click', clickEvent);
            if (!Active.STOP) openStop(position.stop);
            window.addEventListener('locationupdate', (evt: Event) => {
                const { custom, location } = (evt as CustomEvent<
                    LocationUpdate
                >).detail;
                userMapMarker!.setIcon(custom ? placeShape : userShape);
                userMapMarker!.setPosition(
                    new google.maps.LatLng(
                        location.latitude,
                        location.longitude,
                    ),
                );
            });
        });
    });

    window.addEventListener('resize', function() {
        google.maps.event.trigger(map, 'resize');
        google.maps.event.trigger(streetview, 'resize');
        if (!Active.Route.ID) {
            map!.setCenter(boundsAllStops!.getCenter());
            map!.fitBounds(boundsAllStops!);
        }
    });
}

schedulePromise.then(updateAside);
function updateAside(schedule: GTFSData) {
    interface Aside extends HTMLElement {
        routeListItems: RouteListItem[];
    }

    interface RouteListItem extends HTMLLIElement {
        route_id: string;
    }

    let aside: Aside | null = null;
    const routeListItems: RouteListItem[] = [];
    function generateListItems() {
        for (const route of Object.values(schedule.routes)) {
            const listItem = document.createElement('li') as RouteListItem;
            listItem.style.borderColor = `#${route.route_color}`;
            listItem.route_id = route.route_id;
            const link = dynamicLinkNode(Type.ROUTE, route.route_id, true);
            link.textContent = route.route_long_name;
            listItem.append(link);
            routeListItems.push(listItem);
        }
    }

    documentPromise.then(function() {
        if (aside !== null && typeof aside != 'undefined') {
            insertListItems(aside);
        } else {
            generateListItems();
            aside = document.getElementById('aside') as Aside;
            aside.routeListItems = routeListItems;
            insertListItems(aside);
        }
    });

    function insertListItems(aside: Aside) {
        const nearbyList = document.getElementById('nearby')!;
        const otherList = document.getElementById('other')!;
        otherList.append(...aside.routeListItems);
        locatePromise.then(function(result) {
            for (const item of aside.routeListItems) {
                if (
                    schedule.stops[result.stop].routes.includes(item.route_id)
                ) {
                    nearbyList.appendChild(item);
                } else {
                    otherList.appendChild(item);
                }
            }
        });
    }
}

documentPromise.then(function() {
    uiEvents();
});

function openActive(state: ActiveState) {
    console.log(state);
    return Promise.all([
        openRoute(state.Route.ID!).then(bestTrip =>
            openTrip(state.Route.TRIP ? state.Route.TRIP : bestTrip!),
        ),
        openStop(state.STOP!),
    ]).then(() => {});
}

Promise.all([documentPromise, schedulePromise]).then(function() {
    if (!window.history.state && window.location.search.indexOf('#!') > -1) {
        Active.Route.ID = getQueryVariable('route')
            ? getQueryVariable('route')
            : Active.Route.ID;
        Active.Route.TRIP = getQueryVariable('trip')
            ? getQueryVariable('trip')
            : Active.Route.TRIP;
        Active.STOP = getQueryVariable('stop')
            ? getQueryVariable('stop')
            : Active.STOP;

        openActive(Active);
    } else if (window.history.state) {
        setActiveState(window.history.state);
        openActive(Active);
    }
});

window.onhashchange = function() {
    Active.Route.ID = getQueryVariable('route')
        ? getQueryVariable('route')
        : Active.Route.ID;
    Active.Route.TRIP = getQueryVariable('trip')
        ? getQueryVariable('trip')
        : Active.Route.TRIP;
    Active.STOP = getQueryVariable('stop')
        ? getQueryVariable('stop')
        : Active.STOP;
    openActive(Active);
};
window.onpopstate = function(e) {
    setActiveState(e.state);
    openActive(Active);
};

/**
 * Adds click events to buttons in the site.
 */
function uiEvents() {
    if (!navigator.onLine) {
        document.getElementById('main')!.classList.add('offline');
    }
    document
        .getElementById('map-toggle')!
        .addEventListener('click', switchMapStreetview);
    const select = document.getElementById('trip-select') as HTMLSelectElement &
        Linkable;
    select.Type = Type.TRIP;
    select.addEventListener('change', function(e) {
        select.Value = select.options[select.selectedIndex].value;
        clickEvent.call(select, e);
    });

    function toggleSidebar() {
        document.getElementById('aside')!.classList.toggle('open');
    }
    document
        .getElementById('screen-cover')!
        .addEventListener('click', toggleSidebar);
    document.getElementById('menu')!.addEventListener('click', toggleSidebar);
    document
        .getElementById('alt-menu')!
        .addEventListener('click', toggleSidebar);
}

function removeChildren(parent: HTMLElement) {
    while (parent.firstChild) parent.removeChild(parent.firstChild);
}

/**
 * Swaps map and streetview divs
 * @return {[type]} [description]
 */
function switchMapStreetview(this: HTMLElement) {
    if (!map || !streetview) {
        console.error('Map and StreetViewPanorama have not loaded');
        throw new TypeError();
    }

    const mapParent = document.getElementById('map')!;
    const panoParent = document.getElementById('streetview-header')!;

    if (Active.View.STOP == View.MAP_PRIMARY) {
        mapParent.insertBefore(
            document.getElementById('streetview-canvas')!,
            mapParent.firstChild,
        );
        panoParent.insertBefore(
            document.getElementById('map-canvas')!,
            mapParent.firstChild,
        );
        this.classList.add('on');
        Active.View.STOP = View.STREET_PRIMARY;
    } else if (Active.View.STOP == View.STREET_PRIMARY) {
        mapParent.insertBefore(
            document.getElementById('map-canvas')!,
            mapParent.firstChild,
        );
        panoParent.insertBefore(
            document.getElementById('streetview-canvas')!,
            mapParent.firstChild,
        );
        this.classList.remove('on');
        Active.View.STOP = View.MAP_PRIMARY;
    }
    dispatchEvent(updateEvent);
}

function switchTripView(this: HTMLElement) {
    if (Active.View.ROUTE == View.LIST) {
        Active.View.ROUTE = View.TIMETABLE;
        this.classList.add('timetable');
        this.title = 'View as list';
    } else if (Active.View.ROUTE == View.TIMETABLE) {
        Active.View.ROUTE = View.LIST;
        this.classList.remove('timetable');
        this.title = 'View as timetable';
    }
    openTrip(Active.Route.TRIP!);
}

/**
 * Creates a route UI and opens the section if the map is currently in fullscreen mode.
 * @param  {string} route_id ID of the route
 * @return {Promise<string>} trip_id that can be used in openTrip. Best matches time and open stop, if any.
 * @throws {string} If the ID does not exist
 */
function openRoute(route_id: Route['route_id']) {
    return schedulePromise.then(buses => {
        const thisRoute = buses.routes[route_id];
        if (!thisRoute || !thisRoute.route_id) {
            console.error('Invalid Route %s', route_id);
            //throw route_id;
            return;
        }

        Active.Route.ID = route_id;
        Active.Route.TRIP = null;

        document.title = thisRoute.route_long_name;

        const name = document.getElementById('route_long_name')!;
        name.textContent = thisRoute.route_long_name;
        name.style.backgroundColor = `#${thisRoute.route_color}`;
        name.style.color = `#${thisRoute.route_text_color}`;
        document.getElementById(
            'alt-menu',
        )!.style.fill = `#${thisRoute.route_text_color}`;

        let firstStop: Stop['stop_id'] | undefined;
        let lastStop: Stop['stop_id'] | undefined;
        let largest = 0;
        let earliest = new Date(0, 0, 0, 23, 59, 59, 0);
        let latest = new Date(0, 0, 0, 0, 0, 0, 0);
        let earliestTrip: Trip['trip_id'] | undefined;
        let earliestTripStop: Stop['stop_id'] | undefined;

        const nowTime = nowDateTime();
        let closestTrip: Trip['trip_id'] | undefined;
        let closestTripTime = Number.MAX_VALUE;
        let closestTripStop: Stop['stop_id'] | undefined;
        const select = document.getElementById('trip-select')!;
        removeChildren(select);

        const routeStops = new Set<Stop['stop_id']>();

        for (const trip_id of Object.keys(thisRoute.trips)) {
            const trip = thisRoute.trips[trip_id];
            for (const stop in trip.stop_times) {
                if (stop == '1' && parseInt(trip.direction_id, 10) === 0) {
                    firstStop = trip.stop_times[stop].stop_id;
                } else {
                    if (
                        parseInt(stop, 10) > largest &&
                        parseInt(trip.direction_id, 10) === 0
                    ) {
                        largest = parseInt(stop, 10);
                        lastStop = trip.stop_times[stop].stop_id;
                    }
                }

                routeStops.add(trip.stop_times[stop].stop_id);

                const timeDate = gtfsArrivalToDate(
                    trip.stop_times[stop].arrival_time,
                );
                if (timeDate > latest) {
                    latest = timeDate;
                }
                if (timeDate < earliest) {
                    earliest = timeDate;
                    earliestTrip = trip.trip_id;
                    earliestTripStop = trip.stop_times[stop].stop_id;
                }

                if (
                    timeDate.getTime() - nowTime.getTime() < closestTripTime &&
                    timeDate.getTime() - nowTime.getTime() > 0
                ) {
                    closestTripTime = timeDate.getTime() - nowTime.getTime();
                    closestTrip = trip.trip_id;
                    closestTripStop = trip.stop_times[stop].stop_id;
                }
            }
            if (!closestTrip) {
                //Too late for all bus routes
                closestTripTime =
                    new Date(
                        0,
                        0,
                        1,
                        earliest.getHours(),
                        earliest.getMinutes(),
                        earliest.getSeconds(),
                        0,
                    ).getTime() - nowTime.getTime();
                closestTrip = earliestTrip;
                closestTripStop = earliestTripStop;
            }
            const option = document.createElement('option');
            option.value = trip.trip_id;
            option.textContent = trip.trip_short_name;
            select.appendChild(option);
        }

        const minString =
            Math.floor(closestTripTime / 60000) != 1
                ? Math.floor(closestTripTime / 60000) + ' minutes'
                : '1 minute';
        document.getElementById('place-value')!.textContent =
            'Between ' +
            buses!.stops[firstStop!].stop_name +
            ' - ' +
            buses!.stops[lastStop!].stop_name;
        document.getElementById('time-value')!.textContent =
            stringTime(earliest) + ' - ' + stringTime(latest);
        document.getElementById('next-stop-value')!.textContent =
            'Reaches ' +
            buses!.stops[closestTripStop!].stop_name +
            ' in ' +
            minString;

        document.getElementById('main')!.classList.add('open');

        if (
            navigator.onLine &&
            typeof google === 'object' &&
            typeof google.maps === 'object'
        ) {
            const routeBounds = new google.maps.LatLngBounds();
            for (const marker of markers) {
                if (routeStops.has(marker.stop_id)) {
                    marker.setIcon(normal);
                    marker.setZIndex(200);
                    marker.activeInRoute = true;
                    routeBounds.extend(marker.getPosition()!);
                } else {
                    marker.setIcon(unimportant);
                    marker.setZIndex(null);
                    marker.activeInRoute = false;
                }
            }
            if (stopMarker) {
                stopMarker.setIcon(stopShape);
                stopMarker.setZIndex(300);
            }

            google.maps.event.trigger(map, 'resize');
            map!.setCenter(routeBounds.getCenter());
            map!.fitBounds(routeBounds);
            google.maps.event.trigger(streetview, 'resize');
        }

        window.dispatchEvent(updateEvent);
        openTrip(closestTrip!);
        return closestTrip;
    });
}

/**
 * Creates a Stop fragment in the #stop element
 * @param  {[type]} stop_id Id of the stop to use
 * @return {void}           Creates an element
 */
function openStop(stop_id: Stop['stop_id']) {
    return schedulePromise.then(buses => {
        const thisStop = buses.stops[stop_id];
        if (!thisStop || !thisStop.stop_id) {
            console.error('Invalid Stop %s', stop_id);
            //throw stop_id;
            return;
        }

        Active.STOP = stop_id;

        if (streetview) {
            streetview.setPosition(stopToPos(thisStop));
        }
        if (map) {
            for (const marker of markers) {
                if (marker.activeInRoute || Active.Route.ID == null) {
                    marker.setIcon(normal);
                } else {
                    marker.setIcon(unimportant);
                }
                if (marker.stop_id === thisStop.stop_id) {
                    stopMarker = marker;
                }
            }

            stopMarker!.setIcon(stopShape);
            stopMarker!.setZIndex(300);

            streetview!.setPosition(stopMarker!.getPosition()!);
            google.maps.event.trigger(streetview, 'resize');
            google.maps.event.addListener(
                streetview!,
                'pano_changed',
                function() {
                    document.getElementById(
                        'address',
                    )!.textContent = streetview!.getLocation().description!;
                    streetview!.setPov(streetview!.getPhotographerPov());
                },
            );
        }
        if (!streetview) {
            document.getElementById('stop')!.classList.add('no-streetview');
        }

        document.getElementById('stop_name')!.textContent = thisStop.stop_name;

        const list = document.getElementById('connections')!;
        removeChildren(list);
        for (const route_id of thisStop.routes) {
            const route = buses.routes[route_id];
            const linkItem = dynamicLinkNode(Type.ROUTE, route_id, false);
            linkItem.style.borderColor = `#${route.route_color}`;
            linkItem.textContent = route.route_long_name;

            const listItem = document.createElement('li');
            listItem.append(linkItem);
            if (Active.Route.ID === route_id) {
                listItem.className = 'active-route';
            }
            list.append(listItem);
        }

        document.getElementById('main')!.classList.add('open-stop');
        window.dispatchEvent(updateEvent);
    });
}

function openTrip(trip_id: Trip['trip_id']) {
    return schedulePromise.then(buses => {
        const route = buses.routes[Active.Route.ID!];
        const trip = route.trips[trip_id];
        if (!trip || !trip.trip_id) {
            console.error(
                'Invalid trip %s in route %s',
                trip_id,
                Active.Route.ID,
            );
            //throw trip_id;
            return;
        }

        Active.Route.TRIP = trip_id;

        const schedule = document.getElementById('schedule')!;
        removeChildren(schedule);

        const stopSequence = sequence(trip.stop_times);

        const select = document.getElementById(
            'trip-select',
        ) as HTMLSelectElement;
        for (let option = 0; option < select.options.length; option++) {
            if (select.options[option].value === trip_id) {
                select.selectedIndex = option;
                select.options[option].selected = true;
                break;
            }
        }

        document.getElementById('week-days-value')!.textContent =
            buses.calendar[trip.service_id].text_name;

        for (const sequence of stopSequence) {
            const tripStop = trip.stop_times[sequence];
            const routeListItem = dynamicLinkNode(Type.STOP, tripStop.stop_id);

            const lines = document.createElement('div');
            lines.className = 'lines';
            for (let j = 0; j < 2; j++) {
                const line = document.createElement('span');
                line.className = 'line';
                line.style.backgroundColor = `#${route.route_color}`;
                lines.appendChild(line);
            }
            routeListItem.appendChild(lines);

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = buses.stops[tripStop.stop_id].stop_name;
            routeListItem.appendChild(name);

            const time = document.createElement('time');
            time.textContent = gtfsArrivalToString(tripStop.arrival_time);
            routeListItem.appendChild(time);

            const connection = document.createElement('div');
            connection.className = 'connections';
            for (const connectRoute of buses.stops[tripStop.stop_id].routes) {
                if (connectRoute === Active.Route.ID) {
                    continue;
                }

                const item = document.createElement('span');
                item.className = 'route-dash';
                item.title = buses.routes[connectRoute].route_long_name;
                item.style.backgroundColor =
                    buses.routes[connectRoute].route_color;

                connection.appendChild(item);
            }
            routeListItem.appendChild(connection);
            schedule.appendChild(routeListItem);
        }

        window.dispatchEvent(updateEvent);
    });
}

openCallbacks[Type.ROUTE] = openRoute;
openCallbacks[Type.STOP] = openStop;
openCallbacks[Type.TRIP] = openTrip;