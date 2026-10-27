const schema = {
  "name": "Transportation",
  "aliases": [
    "Luxury Cars",
    "Vintage Cars",
    "Limousine",
    "Horse",
    "Buggy",
    "Wedding Bike",
    "Helicopter Entry"
  ],
  "fields": {
    "vehicleType": "Luxury Car",
    "vehicleCount": 1,
    "rentalDurationHours": 8,
    "decoratedVehicleIncluded": true,
    "chauffeurIncluded": true,
    "fuelIncluded": true,
    "distanceLimitKm": 100,
    "extraKmPrice": 50
  },
  "extraFields": {
    "Horse": {
      "entryDurationMinutes": 30,
      "handlerIncluded": true,
      "permissionsIncluded": false,
      "safetySupportIncluded": true
    },
    "Buggy": {
      "entryDurationMinutes": 30,
      "handlerIncluded": true,
      "permissionsIncluded": false,
      "safetySupportIncluded": true
    },
    "Helicopter Entry": {
      "entryDurationMinutes": 30,
      "handlerIncluded": true,
      "permissionsIncluded": false,
      "safetySupportIncluded": true
    }
  }
};

export default schema;
