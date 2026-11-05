/**
 * Centralized Vehicle Data Source for JET CABS
 * This file serves as the database of all 12 available cars in the fleet.
 */

window.vehiclesData = [
  {
    id: 1,
    name: "AMG GT 63 S",
    brand: "Mercedes-Benz",
    category: "Luxury",
    heroImage: "assets/images/cars/luxury.png",
    galleryImages: [
      "assets/images/cars/luxury.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/luxury.png"
    ],
    hourlyPrice: 85,
    dailyPrice: 520,
    rating: 4.9,
    reviewCount: 128,
    availability: "Available",
    badges: ["Available", "Featured"],
    description: "The Mercedes-AMG GT 63 S combines breathtaking supercar performance with handcrafted daily luxury. Its twin-turbo 4.0L V8 delivers 630 horsepower, while the meticulously designed cabin offers supreme comfort and cutting-edge technology. Whether you're cruising through the city or testing its limits on the highway, it delivers an unforgettable driving experience.",
    vehicleId: "#DRV-AMG-2025-0042",
    bodyType: "4-Door Coupé",
    color: "Obsidian Black Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "9G-Tronic Auto",
      seats: "4 Seats",
      mileage: "12,450 mi",
      engine: "4.0L V8 Biturbo",
      horsepower: "630 HP",
      topSpeed: "195 mph",
      fuelEconomy: "18 mpg",
      driveType: "AWD (4MATIC+)",
      doors: "4 Doors",
      ac: "Dual Zone",
      gps: "Built-in Nav",
      bluetooth: "5.2",
      parking: "360° Sensors",
      camera: "360° View",
      abs: "Standard",
      airbags: "9 Airbags",
      audio: "Burmester 3D"
    },
    features: [
      "Luxury Interior",
      "Leather Seats",
      "Climate Control",
      "Panoramic Sunroof",
      "Cruise Control",
      "Apple CarPlay",
      "Android Auto",
      "Burmester Audio",
      "Wireless Charging",
      "Keyless Entry",
      "Push Button Start",
      "360° Camera",
      "Premium LED Lights",
      "9 Airbags",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "James Anderson",
        date: "Jun 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "Absolutely stunning car. The AMG GT 63 S was in immaculate condition — every detail was perfect. The 630HP engine is incredible on the highway. Interior quality is just out of this world. JET CABS made the whole process seamless."
      },
      {
        name: "Sarah Mitchell",
        date: "May 2026",
        duration: "Rented: 1 Day",
        stars: 5,
        text: "Rented for a special occasion and it exceeded all expectations. The Burmester sound system is phenomenal and the ride quality is silky smooth. Definitely coming back for more!"
      },
      {
        name: "Michael Torres",
        date: "Apr 2026",
        duration: "Rented: 1 Week",
        stars: 5,
        text: "Had this beauty for a week-long road trip. Performance is insane — the launch control feature literally pushes you back in your seat. Car was spotless, service was premium. Five stars all the way."
      }
    ]
  },
  {
    id: 2,
    name: "X7 xDrive40i",
    brand: "BMW",
    category: "SUV",
    heroImage: "assets/images/cars/suv.png",
    galleryImages: [
      "assets/images/cars/suv.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/suv.png"
    ],
    hourlyPrice: 65,
    dailyPrice: 420,
    rating: 4.8,
    reviewCount: 96,
    availability: "Available",
    badges: ["Available", "SUV"],
    description: "The BMW X7 xDrive40i is the pinnacle of luxury SUVs. Offering expansive third-row seating, a powerful turbocharged inline-six engine, and standard xDrive all-wheel drive, it delivers premium comfort in all weather conditions. The perfect choice for family getaways or business trips requiring generous space and cargo capacity.",
    vehicleId: "#DRV-BMW-2025-0018",
    bodyType: "Full-Size SUV",
    color: "Mineral White Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "8-Speed Auto",
      seats: "7 Seats",
      mileage: "8,200 mi",
      engine: "3.0L Turbo I6",
      horsepower: "375 HP",
      topSpeed: "155 mph",
      fuelEconomy: "22 mpg",
      driveType: "AWD (xDrive)",
      doors: "5 Doors",
      ac: "Four-Zone",
      gps: "BMW Live Cockpit",
      bluetooth: "5.0",
      parking: "Parking Assistant",
      camera: "3D Surround View",
      abs: "Standard",
      airbags: "8 Airbags",
      audio: "Harman Kardon"
    },
    features: [
      "7-Seat Capacity",
      "Premium Leather",
      "Panoramic Sky Lounge",
      "Ambient Lighting",
      "Heated Seats",
      "Wireless CarPlay",
      "Android Auto",
      "Harman Kardon Sound",
      "Adaptive Suspension",
      "Active Guard Safety",
      "3-Zone Climate",
      "Power Tailgate",
      "LED Headlights",
      "Voice Control",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "David Miller",
        date: "Jun 2026",
        duration: "Rented: 5 Days",
        stars: 5,
        text: "Outstanding luxury and space. The third row fit our kids perfectly, and the ride comfort on long stretches is best in class. BMW's tech is incredibly intuitive."
      },
      {
        name: "Emily Watson",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 4,
        text: "Very comfortable, handles like a smaller car despite its massive footprint. Renting process was very quick. Highly recommended!"
      },
      {
        name: "Robert Chen",
        date: "Apr 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "The X7 is pure executive luxury. Smooth engine, excellent cargo space for golf bags, and premium sound. Booking was perfect."
      }
    ]
  },
  {
    id: 3,
    name: "Model S Plaid",
    brand: "Tesla",
    category: "Electric",
    heroImage: "assets/images/cars/electric.png",
    galleryImages: [
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png"
    ],
    hourlyPrice: 75,
    dailyPrice: 480,
    rating: 4.9,
    reviewCount: 142,
    availability: "Available",
    badges: ["Available", "Electric"],
    description: "Experience the future of performance with the Tesla Model S Plaid. Boasting over 1,020 horsepower from its tri-motor setup, it is the quickest accelerating production car in the world, going 0-60 mph in under 2 seconds. Coupled with advanced Autopilot, a massive central touchscreen, and a 390-mile range, it redefines the driving experience.",
    vehicleId: "#DRV-TSL-2025-0099",
    bodyType: "Sedan / Hatchback",
    color: "Solid Black",
    specifications: {
      fuel: "Electric",
      transmission: "Single-Speed Auto",
      seats: "5 Seats",
      mileage: "5,100 mi",
      engine: "Tri-Motor Electric",
      horsepower: "1020 HP",
      topSpeed: "200 mph",
      fuelEconomy: "120 MPGe",
      driveType: "AWD (Dual Motor)",
      doors: "5 Doors",
      ac: "Tri-Zone Climate",
      gps: "Tesla Navigation",
      bluetooth: "Tesla Connected",
      parking: "Autopark",
      camera: "Sentry Cameras",
      abs: "Standard",
      airbags: "8 Airbags",
      audio: "Tesla Premium 22-Spk"
    },
    features: [
      "1020 HP Tri-Motor",
      "Autopilot",
      "Yoke Steering Option",
      "17-inch Cinematic Screen",
      "Tesla Arcade Gaming",
      "Wireless Chargers",
      "Premium Audio 22 Speakers",
      "Sentry Mode Security",
      "Heated/Cooled Seats",
      "Over-the-Air Updates",
      "Supercharging Access",
      "Keyless Entry (App/Card)",
      "Premium Connectivity",
      "Panoramic Glass Roof",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Kevin Peterson",
        date: "Jun 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Mind-blowing acceleration. You cannot describe what it feels like to launch this car. It felt brand new, fully charged and clean."
      },
      {
        name: "Jessica Lopez",
        date: "May 2026",
        duration: "Rented: 4 Days",
        stars: 5,
        text: "Autopilot made the highway drive so relaxing. The large screen is great for navigation, and the sound system is better than my home theater."
      },
      {
        name: "Arthur Pendelton",
        date: "Apr 2026",
        duration: "Rented: 1 Day",
        stars: 5,
        text: "Best EV on the market. Extremely quiet, super fast, and supercharging was fast and easy. Excellent customer support from the hosts."
      }
    ]
  },
  {
    id: 4,
    name: "911 Turbo S",
    brand: "Porsche",
    category: "Sports",
    heroImage: "assets/images/cars/sports.png",
    galleryImages: [
      "assets/images/cars/sports.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png"
    ],
    hourlyPrice: 120,
    dailyPrice: 750,
    rating: 5.0,
    reviewCount: 87,
    availability: "Available",
    badges: ["Available", "Luxury"],
    description: "The Porsche 911 Turbo S is the benchmark everyday supercar. Powered by a 3.7L twin-turbo flat-six engine generating 640 horsepower, it sprints 0-60 mph in a blistering 2.6 seconds. Equipped with an 8-speed PDK automatic transmission, active aerodynamics, and all-wheel drive, it delivers precision handling with absolute composure.",
    vehicleId: "#DRV-POR-2025-9118",
    bodyType: "2-Door Sports Coupe",
    color: "GT Silver Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "8-Speed PDK Auto",
      seats: "2 Seats",
      mileage: "3,200 mi",
      engine: "3.7L Twin-Turbo Flat-6",
      horsepower: "640 HP",
      topSpeed: "205 mph",
      fuelEconomy: "17 mpg",
      driveType: "AWD (Quattro Style)",
      doors: "2 Doors",
      ac: "Dual Zone Auto",
      gps: "PCM Nav System",
      bluetooth: "5.1",
      parking: "ParkAssist Rear",
      camera: "Reversing Camera",
      abs: "Porsche Ceramic (PCCB)",
      airbags: "6 Airbags",
      audio: "Bose Surround"
    },
    features: [
      "640 HP Engine",
      "Ceramic Brakes",
      "Sport Chrono Package",
      "Active Aerodynamics",
      "Sport Exhaust",
      "Bose Audio",
      "Apple CarPlay",
      "Heated GT Steering",
      "Adaptive Sport Seats",
      "Alcantara Headliner",
      "Launch Control",
      "PDCC Suspension",
      "LED Matrix Headlights",
      "Dry/Wet Mode Toggle",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Gary Vance",
        date: "Jun 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "The ultimate driving machine. Porsche steering precision is unmatched. The Turbo S accelerates with relentless torque. Impeccable condition."
      },
      {
        name: "Clara Bennett",
        date: "May 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "Absolute monster. It is surprisingly comfortable for a daily driver, yet has track-ready speed at the press of a button."
      },
      {
        name: "Marcus Aurelius",
        date: "Apr 2026",
        duration: "Rented: 1 Day",
        stars: 5,
        text: "Perfect rental. Car was clean, exhaust sounds incredible. JET CABS was quick with handoffs."
      }
    ]
  },
  {
    id: 5,
    name: "A8 L Quattro",
    brand: "Audi",
    category: "Sedan",
    heroImage: "assets/images/cars/sedan.png",
    galleryImages: [
      "assets/images/cars/sedan.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sedan.png"
    ],
    hourlyPrice: 55,
    dailyPrice: 350,
    rating: 4.7,
    reviewCount: 64,
    availability: "Available",
    badges: ["Available", "Sedan"],
    description: "The Audi A8 L Quattro is Audi's flagship long-wheelbase luxury sedan. Offering unparalleled rear passenger legroom, adaptive air suspension, and executive seating comfort, it provides a quiet, cloud-like ride. Equipped with a refined V6 engine and legendary Quattro all-wheel drive, it delivers premium, confident touring.",
    vehicleId: "#DRV-AUD-2025-0088",
    bodyType: "Flagship Luxury Sedan",
    color: "Mythos Black Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "8-Speed Tiptronic",
      seats: "5 Seats",
      mileage: "10,200 mi",
      engine: "3.0L Turbo V6",
      horsepower: "335 HP",
      topSpeed: "130 mph",
      fuelEconomy: "21 mpg",
      driveType: "AWD (Quattro)",
      doors: "4 Doors",
      ac: "Four-Zone Auto",
      gps: "MMI Navigation Plus",
      bluetooth: "5.0",
      parking: "Front & Rear Parking",
      camera: "360° Cameras",
      abs: "Standard",
      airbags: "10 Airbags",
      audio: "Bang & Olufsen"
    },
    features: [
      "Long-Wheelbase Room",
      "Adaptive Air Suspension",
      "Valcona Leather Seats",
      "Dual MMI Touchscreens",
      "Virtual Cockpit Plus",
      "Power Soft-Close Doors",
      "Panoramiic Glass Roof",
      "B&O Sound System",
      "Heated/Cooled Seats",
      "Audi Pre Sense Safety",
      "Rear Power Sunshades",
      "Wireless CarPlay",
      "Heated Steering Wheel",
      "Ambient Contour Lighting",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Leland Stanford",
        date: "Jun 2026",
        duration: "Rented: 4 Days",
        stars: 5,
        text: "Extremely quiet and comfortable cabin. The rear seat space is massive. Perfect for chauffeur duty or long executive commutes."
      },
      {
        name: "Sophia Taylor",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 4,
        text: "Audi's suspension makes the worst roads feel smooth. Very clean vehicle, nice tech dashboard."
      },
      {
        name: "Albert Einstein",
        date: "Mar 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "The interior craftsmanship is extraordinary. Smooth power, great sound, excellent experience."
      }
    ]
  },
  {
    id: 6,
    name: "Sport SVR",
    brand: "Range Rover",
    category: "SUV",
    heroImage: "assets/images/cars/suv.png",
    galleryImages: [
      "assets/images/cars/suv.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/suv.png"
    ],
    hourlyPrice: 90,
    dailyPrice: 580,
    rating: 4.8,
    reviewCount: 73,
    availability: "Available",
    badges: ["Available", "New"],
    description: "The Range Rover Sport SVR is the fastest and most dynamic Land Rover ever built. Featuring a supercharged 5.0L V8 engine that produces 575 horsepower and a signature deep performance growl, it delivers thrilling off-road capability and sports car performance. Complete with custom SVR sports seats and carbon fiber trim.",
    vehicleId: "#DRV-RRO-2025-0102",
    bodyType: "High-Performance SUV",
    color: "Estoril Blue Metallic",
    specifications: {
      fuel: "Diesel",
      transmission: "8-Speed Auto",
      seats: "5 Seats",
      mileage: "6,400 mi",
      engine: "5.0L Supercharged V8",
      horsepower: "575 HP",
      topSpeed: "176 mph",
      fuelEconomy: "16 mpg",
      driveType: "4WD (Terrain Response)",
      doors: "5 Doors",
      ac: "Four-Zone",
      gps: "Touch Pro Duo Nav",
      bluetooth: "5.0",
      parking: "Clear Exit Monitor",
      camera: "360° Camera View",
      abs: "Standard Brembo",
      airbags: "8 Airbags",
      audio: "Meridian Surround 825W"
    },
    features: [
      "575 HP Supercharged V8",
      "Sport Exhaust System",
      "SVR Performance Seats",
      "Carbon Fiber Accents",
      "Adaptive Dynamics Air",
      "Terrain Response 4WD",
      "Meridian Surround Sound",
      "Dual Screen Touch Pro",
      "Panoramic Sunroof",
      "Heated Steering Wheel",
      "Head-Up Display",
      "Blind Spot Assist",
      "Soft Door Close",
      "Matrix LED Headlights",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Brian O'Conner",
        date: "Jun 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "The exhaust note on this SVR is worth the rental alone. It accelerates like a sports car but has the command view of a proper Range Rover."
      },
      {
        name: "Dominic Toretto",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Plenty of power, handles well in corners. Very clean interior, aggressive exterior stance."
      },
      {
        name: "Mia Ortiz",
        date: "Apr 2026",
        duration: "Rented: 5 Days",
        stars: 4,
        text: "Luxury meets speed. Handles mountain roads with complete ease. JET CABS customer service was outstanding."
      }
    ]
  },
  {
    id: 7,
    name: "S-Class S580",
    brand: "Mercedes-Benz",
    category: "Luxury",
    heroImage: "assets/images/cars/luxury.png",
    galleryImages: [
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/luxury.png"
    ],
    hourlyPrice: 95,
    dailyPrice: 600,
    rating: 4.9,
    reviewCount: 156,
    availability: "Available",
    badges: ["Available", "Premium"],
    description: "The Mercedes-Benz S-Class S580 is the global benchmark for luxury sedans. It introduces state-of-the-art technological safety innovation, high-end Nappa leather executive massage seats, a dynamic V8 mild-hybrid engine, and a whisper-quiet cabin environment. Perfect for long-distance cruising, VIP transport, or ultimate comfort.",
    vehicleId: "#DRV-MBZ-2025-0580",
    bodyType: "Luxury Sedan",
    color: "Selenite Grey Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "9G-Tronic Auto",
      seats: "5 Seats",
      mileage: "9,150 mi",
      engine: "4.0L V8 Biturbo Hybrid",
      horsepower: "496 HP",
      topSpeed: "155 mph",
      fuelEconomy: "20 mpg",
      driveType: "AWD (4MATIC)",
      doors: "4 Doors",
      ac: "Thermotronic 4-Zone",
      gps: "MBUX Augmented Reality",
      bluetooth: "5.2",
      parking: "Active Parking Assist",
      camera: "3D View 360°",
      abs: "Standard",
      airbags: "11 Airbags",
      audio: "Burmester 3D Surround"
    },
    features: [
      "Active Massage Seats",
      "MBUX Entertainment",
      "Panoramic Glass Roof",
      "Soft Close Doors",
      "Burmester 3D Audio",
      "Dynamic Airmatic Ride",
      "OLED Central Display",
      "Acoustic Glass Comfort",
      "Heated/Cooled Armrests",
      "Rear Cabin Pillows",
      "ADAS Level 2 Autonomous",
      "Augmented Nav HUD",
      "Wireless Charging Front/Rear",
      "64-Color Ambient Lights",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Gregory Peck",
        date: "Jun 2026",
        duration: "Rented: 4 Days",
        stars: 5,
        text: "The absolute standard in comfort. The massage chairs are incredibly relaxing during highway travel. The tech is futuristic but very easy to use."
      },
      {
        name: "Grace Kelly",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Whisper quiet, outstanding luxury. Smells brand new, spotless handover. Will definitely rent again."
      },
      {
        name: "Frank Sinatra",
        date: "Mar 2026",
        duration: "Rented: 1 Week",
        stars: 5,
        text: "Beautiful styling, supreme prestige. It cruises like a dream, perfect engine balance."
      }
    ]
  },
  {
    id: 8,
    name: "Camry Hybrid XSE",
    brand: "Toyota",
    category: "Sedan",
    heroImage: "assets/images/cars/sedan.png",
    galleryImages: [
      "assets/images/cars/sedan.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/sedan.png"
    ],
    hourlyPrice: 35,
    dailyPrice: 220,
    rating: 4.6,
    reviewCount: 89,
    availability: "Available",
    badges: ["Available", "Hybrid"],
    description: "The Toyota Camry Hybrid XSE is a fuel-efficient hybrid sedan with sporty styling, advanced safety technology, and excellent reliability. Featuring a leather-trimmed interior, sport-tuned suspension, and dynamic hybrid efficiency, it is the ideal vehicle for city driving, daily commuting, and economical road trips.",
    vehicleId: "#DRV-TOY-2025-0789",
    bodyType: "Mid-Size Sedan",
    color: "Wind Chill Pearl",
    specifications: {
      fuel: "Hybrid",
      transmission: "ECVT Auto",
      seats: "5 Seats",
      mileage: "15,200 mi",
      engine: "2.5L 4-Cylinder Hybrid",
      horsepower: "208 HP",
      topSpeed: "115 mph",
      fuelEconomy: "46 mpg",
      driveType: "FWD",
      doors: "4 Doors",
      ac: "Dual Zone Auto",
      gps: "Toyota Connected Nav",
      bluetooth: "5.0",
      parking: "Rear Parking Sonar",
      camera: "Backup Camera Grid",
      abs: "Standard SmartStop",
      airbags: "10 Airbags",
      audio: "JBL Premium 9-Spk"
    },
    features: [
      "Hybrid Fuel Efficiency",
      "Sport-Tuned Suspension",
      "Leather Trimmed Seats",
      "Panoramic Glass Roof",
      "Toyota Safety Sense 2.5",
      "JBL Audio System",
      "Wireless Apple CarPlay",
      "Android Auto",
      "Heated Front Seats",
      "LED Headlights",
      "Smart Key Entry",
      "Qi Wireless Charging",
      "Blind Spot Monitor",
      "Adaptive Cruise Control",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Samuel L. Jackson",
        date: "Jun 2026",
        duration: "Rented: 3 Days",
        stars: 4,
        text: "Outstanding gas mileage! I drove all weekend on a single tank. The sporty XSE trim looks really sharp."
      },
      {
        name: "John Doe",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Comfortable, simple to drive, and extremely reliable. Clean interior, fast check-in process."
      },
      {
        name: "Jane Smith",
        date: "Apr 2026",
        duration: "Rented: 4 Days",
        stars: 5,
        text: "Highly recommend for anyone wanting a worry-free daily rental. Easy connection to CarPlay."
      }
    ]
  },
  {
    id: 9,
    name: "R8 V10 Plus",
    brand: "Audi",
    category: "Sports",
    heroImage: "assets/images/cars/sports.png",
    galleryImages: [
      "assets/images/cars/sports.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png"
    ],
    hourlyPrice: 110,
    dailyPrice: 700,
    rating: 5.0,
    reviewCount: 67,
    availability: "Available",
    badges: ["Available", "Best Seller"],
    description: "The Audi R8 V10 Plus is a mid-engine masterpiece. Powered by a naturally aspirated 5.2-liter V10 engine that produces 602 horsepower and sings to a 8,700 RPM redline, it delivers raw, emotional mechanical performance. Paired with a lightning-fast 7-speed S-Tronic dual-clutch transmission and Quattro AWD, it represents the final era of analog supercars.",
    vehicleId: "#DRV-AUD-2025-0010",
    bodyType: "2-Door Mid-Engine Coupe",
    color: "Kemora Gray Metallic",
    specifications: {
      fuel: "Petrol",
      transmission: "7-Speed Dual-Clutch",
      seats: "2 Seats",
      mileage: "4,300 mi",
      engine: "5.2L Naturally Aspirated V10",
      horsepower: "602 HP",
      topSpeed: "205 mph",
      fuelEconomy: "13 mpg",
      driveType: "AWD (Quattro)",
      doors: "2 Doors",
      ac: "Automatic Climate",
      gps: "Audi Virtual Cockpit Nav",
      bluetooth: "5.0",
      parking: "Front & Rear Sensors",
      camera: "Rearview Camera",
      abs: "Carbon Ceramic",
      airbags: "6 Airbags",
      audio: "Bang & Olufsen 3D"
    },
    features: [
      "602 HP NA V10 Engine",
      "Carbon Ceramic Brakes",
      "Audi Virtual Cockpit",
      "Carbon Fiber Exterior Pack",
      "Sport Exhaust Valve",
      "Quattro AWD System",
      "B&O Sound System",
      "Nappa Leather Seats",
      "Laser Headlights",
      "Launch Control Mode",
      "Flat-Bottom Steering",
      "Dynamic Steering",
      "Magnetic Ride Dampers",
      "Smart Keyless Go",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Tony Stark",
        date: "Jun 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Incredible engine. The V10 howl is mechanical perfection. Instant throttle response from the naturally aspirated setup. Cleanest supercar rental I've had."
      },
      {
        name: "Bruce Wayne",
        date: "May 2026",
        duration: "Rented: 1 Day",
        stars: 5,
        text: "Felt incredibly balanced and planted, even in wet conditions. The booking service was swift."
      },
      {
        name: "Peter Parker",
        date: "Apr 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "A bucket-list experience. Absolutely pristine, handles like a kart. Highly recommend!"
      }
    ]
  },
  {
    id: 10,
    name: "CR-V Touring",
    brand: "Honda",
    category: "SUV",
    heroImage: "assets/images/cars/suv.png",
    galleryImages: [
      "assets/images/cars/suv.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/suv.png"
    ],
    hourlyPrice: 40,
    dailyPrice: 260,
    rating: 4.5,
    reviewCount: 112,
    availability: "Available",
    badges: ["Available"],
    description: "The Honda CR-V Touring is a versatile, comfortable family SUV designed for worry-free daily travel. Equipped with a refined engine, active noise cancellation, a spacious cabin, leather seats, and the full Honda Sensing suite of driver assist features, it offers an incredibly smooth, safe, and practical driving experience.",
    vehicleId: "#DRV-HON-2025-0524",
    bodyType: "Compact SUV",
    color: "Platinum White Pearl",
    specifications: {
      fuel: "Petrol",
      transmission: "CVT Automatic",
      seats: "5 Seats",
      mileage: "18,400 mi",
      engine: "1.5L Turbo 4-Cylinder",
      horsepower: "190 HP",
      topSpeed: "115 mph",
      fuelEconomy: "29 mpg",
      driveType: "AWD (Real Time)",
      doors: "5 Doors",
      ac: "Dual Zone Auto",
      gps: "Honda Satellite Nav",
      bluetooth: "5.0",
      parking: "Parking Sensors",
      camera: "Multi-Angle Rearview",
      abs: "Standard Brake Assist",
      airbags: "8 Airbags",
      audio: "Bose Premium 12-Spk"
    },
    features: [
      "Real Time AWD",
      "Honda Sensing Safety",
      "Bose Sound System",
      "Power Moonroof",
      "Leather Heated Seats",
      "Hands-Free Power Tailgate",
      "Wireless Apple CarPlay",
      "Android Auto",
      "Wireless Phone Charger",
      "Dual Zone AC",
      "Smart Keyless Access",
      "Blind Spot Information",
      "LED Front Headlights",
      "Heated Steering Wheel",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Gary Oldman",
        date: "Jun 2026",
        duration: "Rented: 4 Days",
        stars: 4,
        text: "Great family car. Plenty of trunk space for stroller and luggage. Very smooth ride, good fuel economy."
      },
      {
        name: "Anna Kendrick",
        date: "May 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "Very user-friendly dashboard, good safety features, cleanly maintained. Booking was simple."
      },
      {
        name: "Tom Hanks",
        date: "Apr 2026",
        duration: "Rented: 5 Days",
        stars: 5,
        text: "No issues, handles nicely in bad weather. Easy pickup and dropoff."
      }
    ]
  },
  {
    id: 11,
    name: "Tucson Limited",
    brand: "Hyundai",
    category: "SUV",
    heroImage: "assets/images/cars/suv.png",
    galleryImages: [
      "assets/images/cars/suv.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/suv.png"
    ],
    hourlyPrice: 38,
    dailyPrice: 240,
    rating: 4.6,
    reviewCount: 58,
    availability: "Available",
    badges: ["Available", "New Arrival"],
    description: "The Hyundai Tucson Limited features a striking futuristic exterior design, a premium cabin with Bose premium audio, leather seats, and a panoramic sunroof. Outfitted with advanced SmartSense safety features and dynamic HTRAC all-wheel drive, it delivers premium, contemporary driving utility.",
    vehicleId: "#DRV-HYU-2025-0988",
    bodyType: "Compact SUV",
    color: "Amazon Gray",
    specifications: {
      fuel: "Petrol",
      transmission: "8-Speed Auto",
      seats: "5 Seats",
      mileage: "7,500 mi",
      engine: "2.5L 4-Cylinder",
      horsepower: "187 HP",
      topSpeed: "120 mph",
      fuelEconomy: "26 mpg",
      driveType: "AWD (HTRAC)",
      doors: "5 Doors",
      ac: "Dual Zone Auto",
      gps: "10.25-inch Touch Navigation",
      bluetooth: "5.0",
      parking: "Remote Smart Park",
      camera: "Surround View Monitor",
      abs: "Standard",
      airbags: "8 Airbags",
      audio: "Bose Premium Audio"
    },
    features: [
      "HTRAC AWD System",
      "Panoramic Sunroof",
      "Bose Sound System",
      "10.25-inch Touchscreen",
      "Remote Smart Parking",
      "Surround View Camera",
      "Leather Heated/Ventilated",
      "SmartSense Driver Safety",
      "Heated Steering Wheel",
      "Hands-Free Power Lift",
      "Ambient Interior Lights",
      "Wireless Device Charging",
      "Smart Cruise Control",
      "Android Auto/CarPlay",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Mark Ruffalo",
        date: "Jun 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "The Remote Smart Park feature is amazing! Spotless car, nice panoramic view. A solid rental."
      },
      {
        name: "Scarlett Johansson",
        date: "May 2026",
        duration: "Rented: 3 Days",
        stars: 4,
        text: "Very futuristic design. Inside is extremely comfortable and loaded with technology. Perfect."
      },
      {
        name: "Chris Evans",
        date: "Apr 2026",
        duration: "Rented: 1 Day",
        stars: 5,
        text: "Easy handling, great price. JET CABS is top notch for rental convenience."
      }
    ]
  },
  {
    id: 12,
    name: "Mustang Mach-E GT",
    brand: "Ford",
    category: "Electric",
    heroImage: "assets/images/cars/electric.png",
    galleryImages: [
      "assets/images/cars/electric.png",
      "assets/images/cars/sports.png",
      "assets/images/cars/sedan.png",
      "assets/images/cars/suv.png",
      "assets/images/cars/luxury.png",
      "assets/images/cars/electric.png"
    ],
    hourlyPrice: 60,
    dailyPrice: 380,
    rating: 4.7,
    reviewCount: 45,
    availability: "Available",
    badges: ["Available", "Electric"],
    description: "The Ford Mustang Mach-E GT is an all-electric performance crossover that infuses Mustang heritage with electric capability. Producing 480 horsepower and a massive 634 lb-ft of torque, it launches from 0-60 in 3.5 seconds. Packed with adaptive MagneRide suspension, high-end tech, and a 270-mile range.",
    vehicleId: "#DRV-FOR-2025-0644",
    bodyType: "Electric Performance Crossover",
    color: "Rapid Red Metallic",
    specifications: {
      fuel: "Electric",
      transmission: "Single-Speed Auto",
      seats: "5 Seats",
      mileage: "4,100 mi",
      engine: "Dual Motor Electric",
      horsepower: "480 HP",
      topSpeed: "124 mph",
      fuelEconomy: "84 MPGe",
      driveType: "AWD (eAWD)",
      doors: "5 Doors",
      ac: "Dual Zone Auto",
      gps: "SYNC 4A Navigation",
      bluetooth: "5.0",
      parking: "Active Park Assist",
      camera: "360° Camera View",
      abs: "Standard Brembo",
      airbags: "8 Airbags",
      audio: "B&O Sound System"
    },
    features: [
      "480 HP Dual Motor",
      "MagneRide Suspension",
      "Brembo Braking System",
      "SYNC 4A 15.5\" Display",
      "B&O Sound System",
      "Ford BlueCruise ADAS",
      "Panoramic Fixed Glass",
      "Active Park Assist 2.0",
      "Heated Seats & Steering",
      "Phone As A Key (PAAK)",
      "Wireless Apple CarPlay",
      "Android Auto",
      "Wireless Charger Panel",
      "LED Projection Lights",
      "Roadside Assistance"
    ],
    reviews: [
      {
        name: "Matthew McConaughey",
        date: "Jun 2026",
        duration: "Rented: 3 Days",
        stars: 5,
        text: "Alright, alright, alright. This Mach-E GT has serious power. The torque is instant, and the ride is exceptionally stable."
      },
      {
        name: "Anne Hathaway",
        date: "May 2026",
        duration: "Rented: 2 Days",
        stars: 5,
        text: "Clean, responsive, great range. The 15.5-inch vertical screen is gorgeous. Handover was frictionless."
      },
      {
        name: "Christian Bale",
        date: "Apr 2026",
        duration: "Rented: 4 Days",
        stars: 4,
        text: "Felt very sporty and quick. Brakes are excellent. Charging process at public station went smoothly."
      }
    ]
  }
];

// --- NEW FIX FOR VERIFICATION ---
// Sync availability from dummy local storage (User Dashboard frontend flow)
(function() {
  try {
    const rentedCars = JSON.parse(localStorage.getItem('rentedCars') || '[]');
    window.vehiclesData.forEach(car => {
      // car.name is something like "AMG GT 63 S"
      if (rentedCars.includes(car.name)) {
        car.availability = "Unavailable (Rented)";
        // Update badge to "Unavailable" instead of "Available"
        car.badges = car.badges.map(b => b === "Available" ? "Unavailable" : b);
        if (!car.badges.includes("Unavailable")) {
          car.badges.unshift("Unavailable");
        }
      }
    });
  } catch (e) {}
})();
// --------------------------------
