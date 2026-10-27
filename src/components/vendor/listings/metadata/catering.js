const schema = {
  "name": "Catering Services",
  "aliases": [
    "North Indian Catering",
    "South Indian Catering",
    "Mughlai Catering",
    "Chinese Catering",
    "Continental Catering",
    "Italian Catering",
    "Jain Food",
    "Vegan Catering",
    "Live Counters",
    "BBQ",
    "Dessert Counter",
    "Mocktail Counter",
    "Sweet Counter"
  ],
  "fields": {
    "cuisine": "North Indian",
    "minimumPlates": 100,
    "maximumPlates": 1000,
    "menuItemsCount": 20,
    "vegAvailable": true,
    "nonVegAvailable": false,
    "jainFoodAvailable": true,
    "veganFoodAvailable": true,
    "serviceStyle": "Buffet",
    "waiterCount": 10,
    "cutleryIncluded": true,
    "liveCounterIncluded": false
  },
  "extraFields": {
    "Live Counters": {
      "counterType": "Mocktail",
      "counterCount": 1,
      "servingHours": 4
    },
    "BBQ": {
      "counterType": "Mocktail",
      "counterCount": 1,
      "servingHours": 4
    },
    "Dessert Counter": {
      "counterType": "Mocktail",
      "counterCount": 1,
      "servingHours": 4
    },
    "Mocktail Counter": {
      "counterType": "Mocktail",
      "counterCount": 1,
      "servingHours": 4
    },
    "Sweet Counter": {
      "counterType": "Mocktail",
      "counterCount": 1,
      "servingHours": 4
    }
  }
};

export default schema;
