import { h, Component, ComponentChild } from 'preact';
import { Stop } from '../../server-render/api-types';
import { convertLatLng, LatLngLike } from 'spherical-geometry-js';

const Icon = {
    STOP: {
        url: 'assets/pins.png',
        size: { height: 26, width: 24 },
        scaledSize: { height: 26, width: 120 },
        origin: { x: 0, y: 0 },
        anchor: { x: 12, y: 12 },
    } as google.maps.Icon,
    STOP_OUTSIDE_ROUTE: {
        url: 'assets/pins.png',
        size: { height: 26, width: 24 },
        scaledSize: { height: 26, width: 120 },
        origin: { x: 96, y: 0 },
        anchor: { x: 12, y: 12 },
    } as google.maps.Icon,
    USER_LOCATION: {
        url: 'assets/pins.png',
        size: { height: 26, width: 24 },
        scaledSize: { height: 26, width: 120 },
        origin: { x: 48, y: 0 },
        anchor: { x: 12, y: 12 },
    } as google.maps.Icon,
    SEARCH_RESULT: {
        url: 'assets/pins.png',
        size: { height: 26, width: 24 },
        scaledSize: { height: 26, width: 120 },
        origin: { x: 72, y: 0 },
        anchor: { x: 12, y: 23 },
    } as google.maps.Icon,
    SELECTED_STOP: {
        url: 'assets/pins.png',
        size: { height: 26, width: 24 },
        scaledSize: { height: 26, width: 120 },
        origin: { x: 24, y: 0 },
        anchor: { x: 12, y: 20 },
    } as google.maps.Icon,
};

const ZIndex = {
    STOP: 200,
    STOP_OUTSIDE_ROUTE: 0,
    USER_LOCATION: 1000,
    SEARCH_RESULT: 900,
    SELECTED_STOP: 1000,
};

const StaticMap = (props: {
    height: number;
    width: number;
    stops: Iterable<Pick<Stop, 'stop_id' | 'lat' | 'lon'>>;
    highlighted?: Set<string>;
}) => {
    let markers: string[];
    if (props.highlighted && props.highlighted.size > 0) {
        markers = Array.from(props.stops)
            .filter(stop => props.highlighted!.has(stop.stop_id))
            .map(stop => `${stop.lat},${stop.lon}`);
    } else {
        markers = Array.from(props.stops, stop => `${stop.lat},${stop.lon}`);
    }
    const args = new URLSearchParams({
        key: 'AIzaSyCb-LGdBsQnw3p_4s-DGf_o2lhLEF03nXI',
        markers: markers.join('|'),
        size: `${props.width}x${props.height}`,
    });
    const src = `https://maps.googleapis.com/maps/api/staticmap?${args.toString()}`;
    return (
        <img
            class="map__canvas-static"
            height={props.height}
            width={props.width}
            src={src}
            srcset={`${src} 1x, ${src}&scale=2 2x`}
            alt="Map displaying stop locations on island"
        />
    );
};

interface Props {
    stops?: Iterable<Stop>;
    highlighted?: Set<string>;
    userPosition?: {
        coords: LatLngLike;
        stop_id: string;
    };
    places?: Iterable<LatLngLike>;
    onOpenStop?(stop_id: string): void;
}

interface State {
    mapLoaded: boolean;
}

export class GoogleMap extends Component<Props, State> {
    map?: google.maps.Map;
    mapEl: HTMLDivElement | null = null;

    markers = new Map<string, google.maps.Marker>();
    userPositionMarker?: google.maps.Marker;
    places: google.maps.Marker[] = [];
    stopMarkerData = new WeakMap<google.maps.Marker, string>();

    handleMarkerClick: (this: google.maps.Marker) => void;

    constructor(props: Props) {
        super(props);
        const onMarkerClick = (marker: google.maps.Marker) => {
            const stop_id = this.stopMarkerData.get(marker);
            if (stop_id && this.props.onOpenStop) {
                this.props.onOpenStop(stop_id);
            }
        };
        this.handleMarkerClick = function() {
            onMarkerClick(this);
        };
    }

    async componentDidMount() {
        await import('googlemaps' as string);
        this.map = new google.maps.Map(this.mapEl, {
            center: { lat: 19.6, lng: -155.56 },
            zoom: 10,
        });

        const bounds = this.createStopMarkers();
        if (bounds) this.map.fitBounds(bounds);

        this.createUserLocationMarker();
        this.createPlaceMarkers();
        this.setState({ mapLoaded: true });
        window.addEventListener('resize', () => {
            google.maps.event.trigger(this.map, 'resize');
        });
    }

    componentDidUpdate(prevProps: Props) {
        if (!this.state.mapLoaded) return;
        if (
            this.props.stops !== prevProps.stops ||
            this.props.highlighted !== prevProps.highlighted
        ) {
            const bounds = this.createStopMarkers();
            if (bounds) this.map!.fitBounds(bounds);
        }
        if (this.props.userPosition !== prevProps.userPosition) {
            this.createUserLocationMarker();
        }
        if (this.props.places !== prevProps.places) {
            this.createPlaceMarkers();
        }
    }

    createStopMarkers() {
        if (!this.props.stops) return null;
        const markerBounds = new google.maps.LatLngBounds();
        const highlightedBounds = new google.maps.LatLngBounds();
        const { highlighted = new Set() } = this.props;

        for (const stop of this.props.stops) {
            let marker = this.markers.get(stop.stop_id);
            if (!marker) {
                marker = new google.maps.Marker({
                    position: convertLatLng(stop),
                    title: stop.name,
                    icon: Icon.STOP,
                    map: this.map,
                    zIndex: ZIndex.STOP_OUTSIDE_ROUTE,
                });
                this.stopMarkerData.set(marker, stop.stop_id);
                google.maps.event.addListener(
                    marker,
                    'click',
                    this.handleMarkerClick,
                );
                this.markers.set(stop.stop_id, marker);
            }
            markerBounds.extend(marker.getPosition());

            if (highlighted.has(stop.stop_id)) {
                marker.setIcon(Icon.STOP);
                marker.setZIndex(ZIndex.STOP);
                highlightedBounds.extend(marker.getPosition());
            } else {
                marker.setIcon(Icon.STOP_OUTSIDE_ROUTE);
                marker.setZIndex(0);
            }
        }

        return highlighted.size > 0 ? highlightedBounds : markerBounds;
    }

    createUserLocationMarker() {
        if (this.props.userPosition) {
            const position = convertLatLng(this.props.userPosition.coords);
            if (!this.userPositionMarker) {
                this.userPositionMarker = new google.maps.Marker({
                    position,
                    title: 'My Location',
                    icon: Icon.USER_LOCATION,
                    map: this.map,
                    animation: google.maps.Animation.DROP,
                    zIndex: ZIndex.USER_LOCATION,
                });
            } else {
                this.userPositionMarker.setPosition(position);
                this.userPositionMarker.setMap(this.map!);
            }
            this.stopMarkerData.set(
                this.userPositionMarker,
                this.props.userPosition.stop_id,
            );
        } else if (this.userPositionMarker) {
            this.userPositionMarker.setMap(null);
        }
    }

    createPlaceMarkers() {
        const places = this.props.places || [];
        let i = 0;
        for (const place of places) {
            const marker = this.places[i];
            const position = convertLatLng(place);
            if (!marker) {
                this.places[i] = new google.maps.Marker({
                    position,
                    title: 'Search Location',
                    icon: Icon.SEARCH_RESULT,
                    map: this.map,
                    animation: google.maps.Animation.DROP,
                    zIndex: ZIndex.SEARCH_RESULT,
                });
            } else {
                marker.setPosition(position);
                marker.setMap(this.map!);
            }
            i++;
        }
        // Hide excess place markers
        for (; i < this.places.length; i++) {
            this.places[i].setMap(null);
        }
    }

    render({ stops, highlighted }: Props, { mapLoaded }: State) {
        let staticMap: ComponentChild = null;
        if (stops && !mapLoaded) {
            staticMap = (
                <StaticMap
                    height={640}
                    width={640}
                    stops={stops}
                    highlighted={highlighted}
                />
            );
        }

        return (
            <div id="map-canvas" class="map__canvas">
                {staticMap}
                <div ref={el => (this.mapEl = el)} />
            </div>
        );
    }
}
