const schema = {
  "name": "Decoration Services",
  "aliases": [
    "Wedding Decoration",
    "Floral Decoration",
    "Mandap Decoration",
    "Stage Decoration",
    "Reception Decoration",
    "Haldi Decoration",
    "Mehendi Decoration",
    "Sangeet Decoration",
    "Balloon Decoration",
    "LED Decoration",
    "Theme Decoration",
    "Entry Decoration",
    "Ceiling Decoration",
    "Luxury Decoration",
    "Traditional Decoration"
  ],
  "fields": {
    "eventFunction": "Wedding",
    "decorationStyle": "Floral",
    "theme": "Royal",
    "venueAreaCovered": "Stage and entry",
    "flowerTypes": [
      "Rose",
      "Orchid"
    ],
    "materialIncluded": [
      "Flowers",
      "Fabric",
      "Lights"
    ],
    "setupHours": 8,
    "dismantlingIncluded": true,
    "customizationAvailable": true,
    "lightingIncluded": true
  },
  "extraFields": {
    "Mandap Decoration": {
      "mandapType": "Four pillar",
      "mandapSize": "16x16 feet",
      "seatingCapacity": 20
    },
    "LED Decoration": {
      "ledWallSize": "12x8 feet",
      "screenCount": 2,
      "contentSupportIncluded": true
    }
  }
};

export default schema;
