const schema = {
  "name": "Photography Services",
  "aliases": [
    "Wedding Photography",
    "Candid Photography",
    "Traditional Photography",
    "Cinematic Photography",
    "Pre Wedding Shoot",
    "Post Wedding Shoot",
    "Drone Photography",
    "Wedding Film",
    "Teaser Video",
    "Couple Shoot",
    "Family Photography",
    "Live Streaming"
  ],
  "fields": {
    "eventDays": 2,
    "durationHoursPerDay": 10,
    "photographerCount": 2,
    "videographerCount": 2,
    "droneIncluded": false,
    "albumIncluded": true,
    "albumPages": 40,
    "editedPhotosCount": 300,
    "rawFilesIncluded": false,
    "deliveryDays": 30,
    "reelsIncluded": 3
  },
  "extraFields": {
    "Live Streaming": {
      "streamingPlatform": [
        "YouTube",
        "Zoom"
      ],
      "cameraCount": 3,
      "internetRequired": true,
      "recordingIncluded": true
    },
    "Pre Wedding Shoot": {
      "shootDurationHours": 8,
      "locationsIncluded": 2,
      "outfitChangesAllowed": 3,
      "travelIncluded": false
    },
    "Couple Shoot": {
      "shootDurationHours": 8,
      "locationsIncluded": 2,
      "outfitChangesAllowed": 3,
      "travelIncluded": false
    }
  }
};

export default schema;
