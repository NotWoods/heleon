import { Store } from 'unistore';
import { GTFSData } from '../gtfs-types';
import { convertToLinkable } from './load';
import { State, connect, LocationPermission, store } from './state/store';
import { Type } from './utils/link';
import { closestToUser } from './state/map';
import { locateUser } from './location/locate-user';

const NEARBY_INFO_TEXT: Record<LocationPermission, string> = {
  [LocationPermission.NOT_ASKED]: 'Find routes near my location >',
  [LocationPermission.GRANTED]: '',
  [LocationPermission.DENIED]: 'Location permission denied.',
  [LocationPermission.UNAVALIABLE]: 'Location search failed.',
  [LocationPermission.TIMEOUT]: 'Location search timed out.',
}

/**
 * Hydrate the pre-rendered sidebar HTML.
 */
export function hydrateAside() {
  const nearbyList = document.getElementById('nearby')!;
  const otherList = document.getElementById('other')!;
  const nearbyInfo = document.getElementById('nearby-info')!;

  const routeListItems = new Map<string, HTMLLIElement>();
  for (const child of otherList.children) {
    const listItem = child as HTMLLIElement;
    const route_id = listItem.dataset.route!;

    const link = listItem.querySelector<HTMLAnchorElement>('a.routes__link')!;
    convertToLinkable(link, Type.ROUTE, route_id, store);

    routeListItems.set(route_id, listItem);
  }

  return function connectStore(schedule: GTFSData, store: Store<State>) {
    // Start searching user location on click
    nearbyInfo.addEventListener('click', () => locateUser(store));

    connect(
      store,
      (state) => ({
        permission: state.locatePermission,
      }),
      function showHideButton({ permission }) {
        const text = NEARBY_INFO_TEXT[permission];
        nearbyInfo.textContent = text;
        nearbyInfo.hidden = !text;
      },
    );

    connect(
      store,
      (state) => ({
        nearest: closestToUser(schedule.stops, state),
      }),
      function updateNearbyRoutes({ nearest }) {
        const nearbyRoutes = new Set(nearest?.routes);
        for (const [route_id, listItem] of routeListItems) {
          if (nearbyRoutes.has(route_id)) {
            nearbyList.appendChild(listItem);
          } else {
            otherList.appendChild(listItem);
          }
        }
      },
    );
  };
}