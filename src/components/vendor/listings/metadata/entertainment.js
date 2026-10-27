const schema = {
  "name": "Entertainment",
  "aliases": [
    "DJ",
    "Live Band",
    "Singer",
    "Celebrity Artist",
    "Choreographer",
    "Dance Group",
    "Anchor",
    "MC",
    "Puppet Show",
    "Magic Show",
    "Fireworks",
    "Live Orchestra"
  ],
  "fields": {
    "performanceDurationMinutes": 120,
    "artistCount": 4,
    "setCount": 2,
    "soundSystemIncluded": true,
    "lightingIncluded": false,
    "travelIncluded": false,
    "accommodationRequired": false,
    "customPlaylistAvailable": true
  },
  "extraFields": {
    "DJ": {
      "djDurationHours": 5,
      "soundSystemWattage": 5000,
      "danceFloorSupport": true
    },
    "Fireworks": {
      "fireworkDurationMinutes": 10,
      "licenseIncluded": true,
      "safetyTeamIncluded": true
    }
  }
};

export default schema;
