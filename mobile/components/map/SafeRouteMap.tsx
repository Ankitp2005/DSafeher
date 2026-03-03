import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

export interface RouteData {
    id: string;
    points: { latitude: number, longitude: number }[];
    safety_score: number;
}

interface SafeRouteMapProps {
    origin: { latitude: number, longitude: number };
    destination: { latitude: number, longitude: number };
    route?: RouteData;
    dangerZones?: { id: string, latitude: number, longitude: number, radius: number }[];
    safePlaces?: { id: string, title: string, latitude: number, longitude: number }[];
}

export default function SafeRouteMap({ origin, destination, route, dangerZones = [], safePlaces = [] }: SafeRouteMapProps) {

    const getRouteColor = (score: number) => {
        if (score >= 71) return '#48BB78'; // Safe (Green)
        if (score >= 41) return '#ECC94B'; // Caution (Yellow)
        return '#F56565'; // Avoid (Red)
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: (origin.latitude + destination.latitude) / 2,
                    longitude: (origin.longitude + destination.longitude) / 2,
                    latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 2 + 0.02,
                    longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 2 + 0.02,
                }}
            >
                {/* Origin Marker */}
                <Marker coordinate={origin} title="Origin" pinColor="blue" />

                {/* Destination Marker */}
                <Marker coordinate={destination} title="Destination" pinColor="red" />

                {/* Selected Route Polyline */}
                {route && route.points.length > 0 && (
                    <Polyline
                        coordinates={route.points}
                        strokeColor={getRouteColor(route.safety_score)}
                        strokeWidth={4}
                    />
                )}

                {/* Danger Zones Overlays (Semi-transparent red circles) */}
                {dangerZones.map(zone => (
                    <Circle
                        key={zone.id}
                        center={{ latitude: zone.latitude, longitude: zone.longitude }}
                        radius={zone.radius}
                        fillColor="rgba(245, 101, 101, 0.3)" /* Red */
                        strokeColor="rgba(245, 101, 101, 0.6)"
                        strokeWidth={1}
                    />
                ))}

                {/* Safe Places Markers */}
                {safePlaces.map(place => (
                    <Marker
                        key={place.id}
                        coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                        title={place.title}
                        pinColor="green" /* Custom icon would be better here, but using 'green' pin for now */
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: 250,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        width: Dimensions.get('window').width - 32,
        height: 250,
    },
});
