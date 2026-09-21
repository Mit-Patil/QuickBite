const ERROR_MESSAGES = {
  1: 'Location permission was denied. Allow location access in your browser settings, or search for your area instead.',
  2: 'Your location could not be determined. Try searching for your area instead.',
  3: 'Getting your location took too long. Try again, or search for your area instead.',
};

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser does not support location. Search for your area instead.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        reject(new Error(ERROR_MESSAGES[err.code] || 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}