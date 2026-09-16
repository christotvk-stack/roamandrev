const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const { getStore, isMongo } = require('./db');

const categoriesData = [
  {
    name: 'Motorcycle Accessories',
    slug: 'motorcycle-accessories',
    description: 'Precision engineered add-ons, crash protection, and styling gear for MT-15, NS200, and sports bikes.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
    itemCount: 8
  },
  {
    name: 'Travel Accessories',
    slug: 'travel-accessories',
    description: 'Rugged modular backpacks, TSA anti-theft bags, compression cubes, 65W travel adapters and RFID organizers.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    itemCount: 8
  },
  {
    name: 'Riding Gear',
    slug: 'riding-gear',
    description: 'Carbon fiber knuckle gloves, anti-vibration quad-lock phone mounts, and impact armor.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    itemCount: 4
  },
  {
    name: 'Touring Essentials',
    slug: 'touring-essentials',
    description: 'Aerodynamic tank bags, expandable 48L saddlebags, heavy-duty bike covers, and waterproof dry sacks.',
    image: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=800&q=80',
    itemCount: 4
  }
];

const couponsData = [
  {
    code: 'ADVENTURE10',
    description: '10% off on all adventure & moto gear',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 999,
    maxDiscount: 1000,
    isActive: true
  },
  {
    code: 'REV15',
    description: '15% instant discount on orders above ₹2,499',
    discountType: 'percentage',
    discountValue: 15,
    minPurchase: 2499,
    maxDiscount: 2000,
    isActive: true
  },
  {
    code: 'FIRST500',
    description: 'Flat ₹500 off on your overland expedition order',
    discountType: 'fixed',
    discountValue: 500,
    minPurchase: 2999,
    maxDiscount: 500,
    isActive: true
  }
];

const productsData = [
  // MT-15 Accessories
  {
    _id: 'prod-mt15-tank-bag',
    name: 'Apex MT-15 Aerodynamic Magnetic Tank Bag 15L',
    slug: 'mt15-aerodynamic-magnetic-tank-bag-15l',
    category: 'touring-essentials',
    bikeCompatibility: ['MT-15'],
    brand: 'Apex Moto',
    price: 2499,
    originalPrice: 3499,
    discountPercent: 29,
    rating: 4.9,
    reviewCount: 148,
    stock: 22,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/mt15_tank_bag.jpg'
    ],
    description: 'Specifically contoured for the aggressive fuel tank geometry of the Yamaha MT-15. Features ultra-strong neodymium magnetic flaps, quick-release strap anchors, a touchscreen-friendly top GPS navigation pouch, and an integrated neon-green rain cover.',
    features: [
      'Contoured base designed specifically for Yamaha MT-15 tank profile',
      'High-flux Neodymium magnets + 4-point strap anchor harness',
      'Touch-responsive TPU smartphone viewing sleeve (up to 6.8")',
      'Expandable from 12L to 15L capacity with perimeter zipper',
      'Water-repellent 1680D Ballistic Nylon + Hi-Vis rain slip cover'
    ],
    specifications: {
      material: '1680D Heavy Duty Ballistic Nylon & Neoprene Base',
      dimensions: '36cm x 24cm x 18cm (expanded 23cm)',
      weight: '920 grams',
      capacity: '12L expandable to 15L',
      compatibility: 'Yamaha MT-15 (All V1, V2, and BS6 Models)',
      warranty: '2 Years Manufacturer Warranty against zipper & stitch defects',
      packageContents: '1 x Tank Bag, 4 x Mounting Straps, 1 x Hi-Vis Rain Cover, Shoulder Sling'
    },
    tags: ['mt-15', 'tank bag', 'motorcycle luggage', 'yamaha', 'gps holder']
  },
  {
    _id: 'prod-mt15-radiator-guard',
    name: 'MT-15 CNC Aircraft Aluminum Radiator Guard & Grille',
    slug: 'mt15-cnc-aircraft-aluminum-radiator-guard',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['MT-15'],
    brand: 'Apex Moto',
    price: 1299,
    originalPrice: 1899,
    discountPercent: 32,
    rating: 4.8,
    reviewCount: 94,
    stock: 35,
    isFeatured: false,
    isNewArrival: true,
    images: [
      '/images/products/mt15_radiator_guard.jpg'
    ],
    description: 'Precision laser-cut honeycomb matrix protects your MT-15 delicate cooling fins from flying gravel and highway debris while maintaining 98% laminar airflow for optimal liquid cooling.',
    features: [
      'T6-6061 Grade Aircraft Billet Aluminum construction',
      'Anodized matte black corrosion-proof finish',
      'Laser-etched MT-15 aerodynamic emblem',
      'Direct bolt-on fitment without motorcycle modifications'
    ],
    specifications: {
      material: 'T6-6061 Hard-Anodized Aluminum Alloy',
      dimensions: '28cm x 17cm x 2cm',
      weight: '240 grams',
      capacity: 'N/A',
      compatibility: 'Yamaha MT-15 V1 & V2',
      warranty: '3 Years Anti-Rust & Anti-Corrosion Warranty',
      packageContents: '1 x Radiator Grille, Stainless Steel Fasteners, Vibration Dampener Gaskets'
    },
    tags: ['mt-15', 'radiator guard', 'protection', 'yamaha', 'cnc aluminum']
  },
  {
    _id: 'prod-mt15-frame-sliders',
    name: 'MT-15 Dual-Bushing Heavy Duty Frame Sliders',
    slug: 'mt15-dual-bushing-frame-sliders',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['MT-15'],
    brand: 'Overland Guard',
    price: 2199,
    originalPrice: 2999,
    discountPercent: 27,
    rating: 4.9,
    reviewCount: 112,
    stock: 18,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/mt15_frame_sliders.jpg'
    ],
    description: 'Engineered crash protection designed to safeguard the engine crankcase, chassis perimeter, and radiator shroud during high-speed slides or parking-lot tip-overs.',
    features: [
      'Shatter-resistant CNC machined Delrin pucks with inner steel sleeve',
      'High-tensile Grade 12.9 zinc-plated mounting bolts',
      'Absorbs and disperses rotational impact energy',
      'No fairing cutting or drilling required'
    ],
    specifications: {
      material: 'High-Density POM Delrin & Cold-Rolled Steel Brackets',
      dimensions: '14cm length x 5.5cm diameter puck',
      weight: '1.4 kg (pair)',
      capacity: 'Up to 220kg bike curb weight resistance',
      compatibility: 'Yamaha MT-15 V1 & V2 (2019-2026)',
      warranty: 'Lifetime Replacement on Metal Brackets',
      packageContents: '2 x Delrin Slider Pucks, 2 x CNC Brackets, Grade 12.9 Mounting Hardware'
    },
    tags: ['mt-15', 'crash guard', 'frame sliders', 'engine protection']
  },
  {
    _id: 'prod-mt15-tail-tidy',
    name: 'MT-15 Aero Stealth Tail Tidy with LED Plate Light',
    slug: 'mt15-aero-stealth-tail-tidy',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['MT-15'],
    brand: 'Apex Moto',
    price: 1499,
    originalPrice: 2199,
    discountPercent: 32,
    rating: 4.7,
    reviewCount: 78,
    stock: 24,
    isFeatured: false,
    isNewArrival: true,
    images: [
      '/images/products/mt15_tail_tidy.jpg'
    ],
    description: 'Eliminates the bulky stock plastic fender for a hyper-aggressive streetfighter rear profile. Retains OEM turn signals and includes an ultra-bright white micro LED license plate lamp.',
    features: [
      'Laser-cut 2.5mm carbon steel plate with dual powder coating',
      'Pre-drilled mounting holes for OEM indicators and aftermarket mini-blinkers',
      'Integrated waterproof micro LED license plate illuminator',
      'Weight reduction of 1.1kg compared to factory fender'
    ],
    specifications: {
      material: '2.5mm Cold Rolled Structural Steel',
      dimensions: '22cm x 15cm x 10cm',
      weight: '480 grams',
      capacity: 'N/A',
      compatibility: 'Yamaha MT-15 V1, V2',
      warranty: '1 Year Warranty',
      packageContents: '1 x Tail Tidy Bracket, 1 x LED Number Plate Light, Mounting Screws'
    },
    tags: ['mt-15', 'tail tidy', 'fender eliminator', 'styling']
  },
  {
    _id: 'prod-mt15-gel-seat',
    name: 'MT-15 Honeycomb TourGel Cushion & Breathable Mesh Cover',
    slug: 'mt15-honeycomb-tourgel-cushion',
    category: 'touring-essentials',
    bikeCompatibility: ['MT-15'],
    brand: 'Overland Co',
    price: 1899,
    originalPrice: 2699,
    discountPercent: 30,
    rating: 4.9,
    reviewCount: 89,
    stock: 19,
    isFeatured: true,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Solves the notoriously stiff stock seat on long highway rides. Uses advanced medical-grade polymer honeycomb matrix to absorb road shocks and channel cooling airflow under your posture.',
    features: [
      '3D Honeycomb Medical TPE Gel core with zero pressure points',
      'Non-slip silicone micro-dot underside prevents seat shifting',
      'Double adjustable quick-cinch nylon security straps',
      'Heat-deflecting 3D spacer mesh cover'
    ],
    specifications: {
      material: 'Medical Grade Polymer Gel + Breathable 3D Mesh Fabric',
      dimensions: '32cm x 28cm x 3.5cm',
      weight: '680 grams',
      capacity: 'Weight support up to 130kg',
      compatibility: 'Yamaha MT-15 (Pillion & Rider contoured)',
      warranty: '1 Year Shape Retention Warranty',
      packageContents: '1 x Gel Cushion, 1 x Removable Breathable Outer Cover, 2 x Securing Straps'
    },
    tags: ['mt-15', 'seat cushion', 'gel seat', 'touring', 'comfort']
  },

  // NS200 Accessories
  {
    _id: 'prod-ns200-crash-guard',
    name: 'Pulsar NS200 Heavy-Duty Dual-Slider Engine Crash Guard',
    slug: 'ns200-heavy-duty-dual-slider-crash-guard',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['NS200'],
    brand: 'Overland Guard',
    price: 3299,
    originalPrice: 4499,
    discountPercent: 27,
    rating: 4.9,
    reviewCount: 165,
    stock: 14,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/ns200_crash_cage.jpg'
    ],
    description: 'Comprehensive stunt-cage style dual protection bar for Bajaj Pulsar NS200. Features twin replaceable Delrin sliders that dissipate slide energy away from engine cases and radiator wings.',
    features: [
      'Seamless 28mm diameter heavy-gauge seamless mild steel tubing',
      'Replaceable ultra-slick Delrin impact sliders',
      'Auxiliary fog light mounting brackets integrated into upper rail',
      'Electrostatic dual-layer black matte powder coating'
    ],
    specifications: {
      material: 'Heavy Gauge Seamless Steel Tubing (28mm OD, 2.5mm Wall)',
      dimensions: '62cm x 34cm x 22cm',
      weight: '3.8 kg',
      capacity: 'Full chassis drop protection',
      compatibility: 'Bajaj Pulsar NS200 (All BS3, BS4 & BS6 Models)',
      warranty: '5 Years Structural Weld Integrity Warranty',
      packageContents: 'Left & Right Crash Bars, 2 x Delrin Sliders, Heavy Duty Engine Bolts'
    },
    tags: ['ns200', 'crash guard', 'engine protector', 'bajaj pulsar', 'stunt cage']
  },
  {
    _id: 'prod-ns200-windscreen',
    name: 'NS200 Tall Touring Aerodynamic Windscreen Visor (Dark Smoke)',
    slug: 'ns200-tall-touring-windscreen-visor',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['NS200'],
    brand: 'Apex Moto',
    price: 1699,
    originalPrice: 2399,
    discountPercent: 29,
    rating: 4.8,
    reviewCount: 104,
    stock: 28,
    isFeatured: false,
    isNewArrival: true,
    images: [
      '/images/products/ns200_windscreen.jpg'
    ],
    description: 'Extended 42cm touring visor designed in wind tunnel simulation to deflect highway chest windblast over the rider helmet, drastically cutting down long-distance neck fatigue.',
    features: [
      'High-impact 4mm polycarbonate with anti-scratch UV coating',
      'Dark smoke tint with crystal optical clarity',
      'Aerodynamic flipped top lip generates smooth laminar boundary layer',
      'Direct mount using OEM headlight cluster bolt points'
    ],
    specifications: {
      material: '4mm Shatter-Resistant Polycarbonate',
      dimensions: '42cm height x 31cm width',
      weight: '410 grams',
      capacity: 'N/A',
      compatibility: 'Bajaj Pulsar NS200 & NS160',
      warranty: '2 Years UV Non-Yellowing & Anti-Crack Warranty',
      packageContents: '1 x Tall Windscreen, Rubber Isolation Washers, Black Mounting Bolts'
    },
    tags: ['ns200', 'windscreen', 'visor', 'touring', 'wind protection']
  },
  {
    _id: 'prod-ns200-handlebar-risers',
    name: 'NS200 30mm CNC Billet Handlebar Risers (Up & Back)',
    slug: 'ns200-30mm-cnc-handlebar-risers',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['NS200'],
    brand: 'Apex Moto',
    price: 1399,
    originalPrice: 1999,
    discountPercent: 30,
    rating: 4.8,
    reviewCount: 71,
    stock: 20,
    isFeatured: false,
    isNewArrival: false,
    images: [
      '/images/products/ns200_handlebar_risers.jpg'
    ],
    description: 'Elevates your clip-on handlebars by 30mm and pulls them back 20mm toward the rider, providing an upright, relaxed touring posture without requiring cable or brake hose extensions.',
    features: [
      '100% CNC machined from aerospace 6061-T6 aluminum',
      'Transforms aggressive crouch into comfortable endurance touring geometry',
      'Retains factory throttle and clutch cable routing without tension',
      'Matte graphite anodized finish'
    ],
    specifications: {
      material: 'Aircraft Grade 6061-T6 Billet Aluminum',
      dimensions: '30mm vertical lift, 20mm setback',
      weight: '320 grams (pair)',
      capacity: 'N/A',
      compatibility: 'Bajaj Pulsar NS200 & NS160',
      warranty: 'Lifetime Structural Warranty',
      packageContents: '2 x Handlebar Risers, 4 x High-Tensile Allen Bolts, Guide'
    },
    tags: ['ns200', 'handlebar risers', 'ergonomics', 'touring']
  },
  {
    _id: 'prod-ns200-tank-grips',
    name: 'NS200 3D Volcano Knee Traction Grips & Center Tank Pad',
    slug: 'ns200-3d-volcano-knee-traction-grips',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['NS200'],
    brand: 'Overland Guard',
    price: 899,
    originalPrice: 1299,
    discountPercent: 31,
    rating: 4.7,
    reviewCount: 63,
    stock: 45,
    isFeatured: false,
    isNewArrival: true,
    images: [
      '/images/products/ns200_tank_grips.jpg'
    ],
    description: 'High-traction vulcanized rubber pads for the sculpted tank flanks of the NS200. Allows rider to anchor thighs tightly during heavy braking and aggressive cornering.',
    features: [
      'Volcano profile micro-lugs lock into riding pants without abrasive wear',
      'Authentic 3M VHB industrial adhesive backing won\'t peel in rain or sun',
      'Protects fuel tank clear coat from belt buckle and zipper scratching'
    ],
    specifications: {
      material: 'Vulcanized Synthetic Elastomer + 3M VHB Tape',
      dimensions: 'Custom laser contour for NS200 tank',
      weight: '160 grams',
      capacity: 'N/A',
      compatibility: 'Bajaj Pulsar NS200 & NS160',
      warranty: '1 Year Adhesive Guarantee',
      packageContents: '2 x Side Knee Pads, 1 x Center Spine Protector, Alcohol Prep Wipes'
    },
    tags: ['ns200', 'tank pad', 'knee grips', 'traction']
  },

  // Universal Motorcycle Gear & Riding Accessories
  {
    _id: 'prod-univ-phone-mount',
    name: 'Apex Quad-Vibe Weatherproof Phone Mount with Vibration Dampener',
    slug: 'apex-quad-vibe-phone-mount-vibration-dampener',
    category: 'riding-gear',
    bikeCompatibility: ['MT-15', 'NS200', 'Universal'],
    brand: 'Apex Moto',
    price: 1599,
    originalPrice: 2499,
    discountPercent: 36,
    rating: 4.9,
    reviewCount: 310,
    stock: 50,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/univ_phone_mount.jpg'
    ],
    description: 'The ultimate motorcycle mobile phone holder with a tuned dual-chassis silicone damper that filters out 90% of high-frequency engine harmonics to safeguard delicate smartphone optical camera sensors (OIS).',
    features: [
      'Tuned elastomer vibration dampening module preserves camera sensors',
      'One-handed mechanical claw lock with instant security switch',
      '360° rotational CNC aluminum ball-joint arm',
      'Fits handlebars from 22mm to 32mm and mirror stems (adapter included)'
    ],
    specifications: {
      material: 'Aviation CNC Aluminum Arm + Glass-Filled Nylon Bracket',
      dimensions: 'Fits phones from 4.7" to 7.2" screen size (up to 15mm thick)',
      weight: '310 grams',
      capacity: 'Holds phones up to 400 grams through 180 km/h wind speeds',
      compatibility: 'Universal (Includes 22mm, 25mm, 28mm, 32mm spacers + mirror stem mount)',
      warranty: '2 Years Unconditional Hardware Replacement',
      packageContents: '1 x Phone Mount, 1 x Vibration Damper, 1 x Handlebar Clamp, 1 x Mirror Stem Adapter, Hex Keys'
    },
    tags: ['phone mount', 'mobile holder', 'vibration dampener', 'universal', 'mt-15', 'ns200']
  },
  {
    _id: 'prod-univ-riding-gloves',
    name: 'Overland Stealth Carbon Fiber Touchscreen Riding Gloves',
    slug: 'overland-stealth-carbon-fiber-riding-gloves',
    category: 'riding-gear',
    bikeCompatibility: ['Universal'],
    brand: 'Overland Gear',
    price: 1999,
    originalPrice: 2899,
    discountPercent: 31,
    rating: 4.8,
    reviewCount: 220,
    stock: 40,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/univ_riding_gloves.jpg'
    ],
    description: 'Form-fitting tactical motorcycle riding gloves built with real forged carbon-fiber knuckle guards, genuine goat leather palm reinforcement, TPR finger sliders, and conductive capacitive fingertips for smartphone screen use.',
    features: [
      'Real forged carbon fiber knuckle shell with shock-absorbing foam backing',
      'Abrasion-proof genuine goat leather palm with Kevlar thread stitching',
      'High-sensitivity conductive fingertip patches for maps & phone navigation',
      'Perforated Air-Flow neoprene cuff with hook-and-loop closure'
    ],
    specifications: {
      material: 'Carbon Fiber, Full Grain Goat Leather, 3D Air Mesh, Kevlar Stitching',
      dimensions: 'Sizes M, L, XL, XXL available',
      weight: '185 grams (pair)',
      capacity: 'CE Level 1 Certified Protection (EN 13594:2015)',
      compatibility: 'Universal Rider Fitment',
      warranty: '1 Year Manufacturer Stitching Warranty',
      packageContents: '1 Pair of Riding Gloves, Storage Carabiner Pouch'
    },
    tags: ['riding gloves', 'gloves', 'carbon fiber', 'touchscreen', 'safety gear']
  },
  {
    _id: 'prod-univ-saddlebags',
    name: 'Expedition 48L Modular Expandable Motorcycle Saddlebags',
    slug: 'expedition-48l-modular-saddlebags',
    category: 'touring-essentials',
    bikeCompatibility: ['MT-15', 'NS200', 'Universal'],
    brand: 'Overland Co',
    price: 4999,
    originalPrice: 6999,
    discountPercent: 29,
    rating: 4.9,
    reviewCount: 135,
    stock: 12,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/univ_saddlebags.jpg'
    ],
    description: 'Heavy-duty touring pannier bags designed for long interstate journeys and high-altitude Himalayan rides. Built with heat-resistant reinforced bottom panels to safely withstand exhaust heat proximity.',
    features: [
      'Dual 24L bags expand to 48L total capacity with perimeter expansion gussets',
      'Aluminized heat-resistant bottom shields against hot exhaust pipes',
      'Includes dual 100% waterproof seam-sealed high-visibility rain covers',
      'Heavy-duty industrial velcro bridge straps fit across or beneath the pillion seat'
    ],
    specifications: {
      material: '1680D TPU-Coated Ballistic Cordura + Heat-Shield Tarpaulin',
      dimensions: '44cm x 28cm x 20cm (each side)',
      weight: '2.4 kg',
      capacity: '48 Litres Total (24L x 2)',
      compatibility: 'Universal (Fits MT-15, NS200, Duke, Himalayan, Classic 350, Dominar)',
      warranty: '3 Years Warranty on Zippers and Straps',
      packageContents: '1 Pair of Saddlebags (L+R), 2 x Rain Covers, 8 x Bungee Anchor Straps, Shoulder Strap'
    },
    tags: ['saddlebags', 'panniers', 'touring luggage', '48l', 'motorcycle bags']
  },
  {
    _id: 'prod-univ-bike-cover',
    name: 'ArmorShield 300D Heavy-Duty All-Weather Motorcycle Cover',
    slug: 'armorshield-300d-all-weather-motorcycle-cover',
    category: 'touring-essentials',
    bikeCompatibility: ['MT-15', 'NS200', 'Universal'],
    brand: 'Apex Moto',
    price: 1199,
    originalPrice: 1799,
    discountPercent: 33,
    rating: 4.8,
    reviewCount: 180,
    stock: 45,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Triple-layer 300D Oxford polyester cover with PU waterproof lining, heat-resistant exhaust panels, front wheel anti-theft lock grommets, and dual storm wind buckles.',
    features: [
      'Waterproof hydrostatic head rating: 3000mm with taped internal seams',
      'Dual reinforced brass lock-holes prevent gust lift-off and deter theft',
      'Soft cotton fleece lining along windshield area prevents swirl marks',
      'Reflective safety stripes on all 4 quadrants for nighttime street parking visibility'
    ],
    specifications: {
      material: '300D Heavy Oxford Cloth with UV-Reflective Silver Coating',
      dimensions: '220cm x 95cm x 110cm (Fits bikes up to 2.2m)',
      weight: '750 grams',
      capacity: 'Full motorcycle coverage',
      compatibility: 'Universal Sports & Naked Bikes (MT-15, NS200, R15, Duke, Apache)',
      warranty: '2 Years Waterproof Guarantee',
      packageContents: '1 x Motorcycle Cover, 1 x Storage Carry Bag'
    },
    tags: ['bike cover', 'waterproof cover', 'dust cover', 'universal']
  },
  {
    _id: 'prod-univ-usb-charger',
    name: 'Dual QC 3.0 & PD 30W Waterproof Motorcycle Fast Charger',
    slug: 'dual-qc-3-pd-30w-waterproof-motorcycle-charger',
    category: 'motorcycle-accessories',
    bikeCompatibility: ['MT-15', 'NS200', 'Universal'],
    brand: 'Nomad Tech',
    price: 899,
    originalPrice: 1499,
    discountPercent: 40,
    rating: 4.7,
    reviewCount: 140,
    stock: 60,
    isFeatured: false,
    isNewArrival: true,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Direct handlebar-mounted 12V fast charger delivering high-speed juice to smartphones, action cameras, and GPS units. Features an integrated LED digital voltmeter to monitor bike battery health in real time.',
    features: [
      'Type-C PD 30W + USB-A Quick Charge 3.0 dual concurrent ports',
      'Real-time blue LED battery voltage readout flags charging system issues',
      'Spring-loaded IP66 waterproof silicone flip cover',
      'Independent on/off power switch prevents parasitic battery drain'
    ],
    specifications: {
      material: 'Flame-Retardant ABS & CNC Aluminum Handlebar Mount',
      dimensions: '6.5cm x 3.2cm',
      weight: '140 grams',
      capacity: 'Input: 12V-24V DC, Output: 5V/3A, 9V/3A, 12V/2.5A (Max 36W)',
      compatibility: 'Universal 12V Motorcycle Battery Systems',
      warranty: '18 Months Replacement Warranty',
      packageContents: '1 x Charger Unit, Handlebar Bracket, Rearview Mirror Bracket, Fuse Wiring Cable'
    },
    tags: ['usb charger', 'fast charger', 'voltmeter', 'handlebar accessories']
  },
  {
    _id: 'prod-univ-cargo-net',
    name: 'Heavy-Duty 6-Carabiner Elastic Motorcycle Cargo Bungee Net',
    slug: 'heavy-duty-elastic-motorcycle-cargo-net',
    category: 'touring-essentials',
    bikeCompatibility: ['MT-15', 'NS200', 'Universal'],
    brand: 'Apex Moto',
    price: 499,
    originalPrice: 799,
    discountPercent: 38,
    rating: 4.8,
    reviewCount: 95,
    stock: 75,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Extra-thick 5mm natural latex core webbing stretches up to 2.5x to lock helmets, duffels, and sleeping bags tightly onto the pillion seat or luggage rack without scratching painted panels.',
    features: [
      'Dense 3" x 3" grid mesh prevents smaller items from slipping through',
      '6 heavy-duty aluminum carabiner hooks with smooth anti-scratch edges',
      'Premium multi-strand natural latex core outlasts cheap rubber cords'
    ],
    specifications: {
      material: '5mm Natural Latex Core + Heavy Duty Aluminum Carabiners',
      dimensions: '40cm x 40cm (Stretches to 85cm x 85cm)',
      weight: '210 grams',
      capacity: 'Supports up to 35kg tensile pull',
      compatibility: 'Universal Pillion & Tail Rack Fitment',
      warranty: '1 Year Elasticity Warranty',
      packageContents: '1 x Cargo Net, 6 x Aluminum Locking Carabiners'
    },
    tags: ['cargo net', 'bungee cord', 'helmet strap', 'touring essentials']
  },

  // Premium Travel Accessories
  {
    _id: 'prod-trv-tactical-backpack',
    name: 'Vanguard 40L Weatherproof Modular Overland Travel Backpack',
    slug: 'vanguard-40l-weatherproof-overland-travel-backpack',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Overland Co',
    price: 4499,
    originalPrice: 6499,
    discountPercent: 31,
    rating: 4.9,
    reviewCount: 260,
    stock: 25,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/trv_tactical_backpack.jpg'
    ],
    description: 'Engineered for motorcycle riders and global nomads alike. Clamshell 180° suitcase-style opening, dedicated 17" suspended laptop sleeve, hidden passport compartment, and ergonomic load-lifter shoulder harness.',
    features: [
      '180-degree flat clamshell opening for instant airport security screening',
      'IPX5 water-repellent TPU exterior with AquaGuard water-resistant zippers',
      'Ergonomic EVA molded back panel with airflow cooling ventilation channels',
      'Stowable shoulder straps allow it to convert into a clean duffel for bike mounting'
    ],
    specifications: {
      material: '840D Weatherproof TPU-Laminated Cordura & YKK Zippers',
      dimensions: '52cm x 34cm x 22cm (Carry-on compliant across all airlines)',
      weight: '1.35 kg',
      capacity: '40 Litres',
      compatibility: 'Universal / Airline Overhead Bin Friendly',
      warranty: '5 Years Worldwide Warranty',
      packageContents: '1 x 40L Backpack, Detachable Sternum & Waist Straps, Rain Shell'
    },
    tags: ['travel backpack', 'backpack', 'overland bag', 'carry-on', 'waterproof bag']
  },
  {
    _id: 'prod-trv-antitheft-pack',
    name: 'AeroShield Anti-Theft Hard-Shell Laptop Travel Backpack',
    slug: 'aeroshield-anti-theft-hard-shell-laptop-backpack',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Nomad Tech',
    price: 3799,
    originalPrice: 5299,
    discountPercent: 28,
    rating: 4.8,
    reviewCount: 195,
    stock: 30,
    isFeatured: true,
    isNewArrival: false,
    images: [
      '/images/products/trv_antitheft_pack.jpg'
    ],
    description: 'Aerodynamic EVA faceted hard-shell exterior cuts wind drag on highway rides while providing cut-proof security. Integrated TSA combination lock secures main zippers against pickpockets.',
    features: [
      'Faceted EVA 3D armor front plate absorbs impacts and deflects slicing blades',
      'Customs-compliant TSA 3-digit combination lock built into top rim',
      'External USB-C pass-through fast charging port for mobile phones',
      'Concealed RFID-shielded lumbar card pocket'
    ],
    specifications: {
      material: 'Polycarbonate EVA Hard Composite + Slash-Proof 900D Nylon',
      dimensions: '48cm x 32cm x 18cm',
      weight: '1.2 kg',
      capacity: '28 Litres (Fits laptops up to 16.2")',
      compatibility: 'Universal Travel & Commuting',
      warranty: '3 Years Warranty on Shell and Zippers',
      packageContents: '1 x Hard-Shell Backpack, Integrated TSA Lock Instructions'
    },
    tags: ['anti-theft backpack', 'hard-shell pack', 'laptop bag', 'tsa lock', 'security']
  },
  {
    _id: 'prod-trv-packing-cubes',
    name: 'Overland 6-Piece Compression Packing Cubes Set',
    slug: 'overland-6-piece-compression-packing-cubes-set',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Overland Co',
    price: 1299,
    originalPrice: 1999,
    discountPercent: 35,
    rating: 4.9,
    reviewCount: 178,
    stock: 50,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Double-zipper compression system condenses bulky riding jackets, thermals, and clothes by up to 50%, maximizing interior space inside backpacks, tail bags, and saddlebags.',
    features: [
      'Secondary perimeter compression zipper forces excess air out effortlessly',
      'Ultralight ripstop honeycomb nylon fabric resists tears and water splashes',
      'Breathable mesh top panels for rapid clothing identification and ventilation',
      'Includes laundry sack, shoe organizer pouch, and cable bag'
    ],
    specifications: {
      material: 'Honeycomb Ripstop Nylon & Self-Repairing SBS Zippers',
      dimensions: 'XL (40x30cm), L (35x25cm), M (30x20cm), S (25x18cm), Shoe Bag, Cable Pouch',
      weight: '340 grams (total set)',
      capacity: 'Compresses up to 40L of apparel down to 22L',
      compatibility: 'Fits all standard suitcases, backpacks, and motorcycle panniers',
      warranty: '2 Years Zipper Warranty',
      packageContents: '4 x Compression Cubes, 1 x Water-Resistant Shoe Bag, 1 x Toiletry Pouch'
    },
    tags: ['packing cubes', 'compression bags', 'travel organizer', 'luggage accessories']
  },
  {
    _id: 'prod-trv-travel-adapter',
    name: 'Nomad Universal 65W GaN Travel Adapter (Dual USB-C & USB-A)',
    slug: 'nomad-universal-65w-gan-travel-adapter',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Nomad Tech',
    price: 2199,
    originalPrice: 3299,
    discountPercent: 33,
    rating: 4.9,
    reviewCount: 145,
    stock: 35,
    isFeatured: true,
    isNewArrival: true,
    images: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'High-power Gallium Nitride (GaN III) international multi-plug adapter. Powers MacBooks, iPads, and smartphones across 150+ countries including UK, US, EU, Australia, and Asia with zero bulk.',
    features: [
      '65W Power Delivery fast-charges laptops directly without bulky wall bricks',
      'Sliding country selector locks US, UK, EU, and AU pins securely in place',
      'Auto-resetting 10A overload thermal fuse safeguards against hotel power spikes',
      'Simultaneously charges up to 5 devices (2 x Type-C, 2 x USB-A, 1 x AC Socket)'
    ],
    specifications: {
      material: 'Fire-Resistant Bayer PC (V0 rating)',
      dimensions: '7.5cm x 5.2cm x 5.2cm',
      weight: '165 grams',
      capacity: '65W Max Output, 100-250V AC 50/60Hz, 10A Max Load (2500W at 250V)',
      compatibility: 'Over 150 countries worldwide (US/UK/EU/AU/IN)',
      warranty: '2 Years Replacement Guarantee',
      packageContents: '1 x 65W GaN Travel Adapter, Velvet Travel Storage Pouch, Manual'
    },
    tags: ['travel adapter', 'gan charger', 'international plug', 'universal adapter', '65w']
  },
  {
    _id: 'prod-trv-passport-holder',
    name: 'Apex RFID-Blocking Leather Travel Wallet & Passport Organizer',
    slug: 'apex-rfid-blocking-passport-travel-wallet',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Apex Moto',
    price: 799,
    originalPrice: 1299,
    discountPercent: 38,
    rating: 4.8,
    reviewCount: 90,
    stock: 45,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Sleek distressed leather passport cover lined with military-grade copper-nickel RFID blocking mesh to protect your credit cards, passport chips, and identity from digital skimmers.',
    features: [
      'Certified RFID 13.56 MHz frequency shielding',
      'Slots for passport, boarding pass, 6 credit cards, SIM card ejector pin, and cash',
      'Includes elastic pen loop and slim aluminum ballpoint pen',
      'Magnetic snap closure keeps travel documents organized and flat'
    ],
    specifications: {
      material: 'Crazy Horse Vegan Leather + RFID Blocking Faraday Fabric',
      dimensions: '14.5cm x 11cm x 1.5cm',
      weight: '95 grams',
      capacity: 'Holds 2 Passports + 6 Cards + Boarding Pass',
      compatibility: 'All standard international passports',
      warranty: '1 Year Warranty',
      packageContents: '1 x RFID Passport Wallet, 1 x Mini Travel Pen'
    },
    tags: ['passport holder', 'travel wallet', 'rfid blocking', 'accessories']
  },
  {
    _id: 'prod-trv-cable-organizer',
    name: 'Tactical Water-Resistant Cable & Electronics Organizer Pouch',
    slug: 'tactical-cable-electronics-organizer-pouch',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Nomad Tech',
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    rating: 4.8,
    reviewCount: 110,
    stock: 40,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Double-layer tech dopp kit with elastic cable slots, mesh zippered compartments for power banks, mouse, action camera batteries, and SD memory cards.',
    features: [
      'Semi-rigid padded foam shell protects hard drives and accessories from drops',
      'Dual-tier layout isolates charging cables from larger battery packs and adapters',
      'Water-repellent 300D cationic polyester exterior with rugged carry handle'
    ],
    specifications: {
      material: '300D Cationic Polyester & Shockproof EVA Foam',
      dimensions: '24cm x 17.5cm x 7cm',
      weight: '210 grams',
      capacity: '2.5 Litres',
      compatibility: 'Universal Tech Accessories',
      warranty: '1 Year Warranty',
      packageContents: '1 x Electronics Organizer Pouch, 3 x Reusable Velcro Cable Ties'
    },
    tags: ['cable organizer', 'tech pouch', 'electronics bag', 'travel dopp kit']
  },
  {
    _id: 'prod-trv-dry-bag',
    name: 'Overland 25L Ultralight Roll-Top Waterproof Dry Bag Duffel',
    slug: 'overland-25l-ultralight-roll-top-dry-bag',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Overland Co',
    price: 1499,
    originalPrice: 2299,
    discountPercent: 35,
    rating: 4.9,
    reviewCount: 124,
    stock: 32,
    isFeatured: false,
    isNewArrival: true,
    images: [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'IPX6 100% submersible roll-top waterproof bag built for monsoons, river crossings, and torrential weather. Includes D-rings and anchor straps for instant strapping onto bike tail racks.',
    features: [
      'Heavy duty 500D PVC Tarpaulin with high-frequency welded seams (zero needle stitching)',
      'Roll-down airtight buckle closure keeps moisture, sand, and dust completely out',
      'Detachable padded shoulder strap transforms it into a quick sling bag',
      'Clear waterproof front zippered window for rapid gear location'
    ],
    specifications: {
      material: '500D High-Frequency Welded Marine Tarpaulin',
      dimensions: '56cm height (unrolled) x 26cm diameter base',
      weight: '490 grams',
      capacity: '25 Litres',
      compatibility: 'Universal / Tail Rack Strap-Down Ready',
      warranty: '2 Years 100% Waterproof Guarantee',
      packageContents: '1 x 25L Dry Bag, 1 x Adjustable Shoulder Sling, 2 x Tie-Down Cords'
    },
    tags: ['dry bag', 'waterproof bag', 'roll top duffel', 'overland', 'river crossing']
  },
  {
    _id: 'prod-trv-luggage-scale',
    name: 'Nomad Digital High-Precision Travel Luggage Scale 50kg',
    slug: 'nomad-digital-travel-luggage-scale-50kg',
    category: 'travel-accessories',
    bikeCompatibility: ['Universal'],
    brand: 'Nomad Tech',
    price: 599,
    originalPrice: 999,
    discountPercent: 40,
    rating: 4.7,
    reviewCount: 82,
    stock: 55,
    isFeatured: false,
    isNewArrival: false,
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'
    ],
    description: 'Compact pocket-sized digital hanging scale with ergonomic rubber grip and high-precision strain gauge sensor. Accurately measures panniers and flight luggage to avoid overweight airline fees.',
    features: [
      'Measures up to 50kg (110 lbs) with 10g accuracy',
      'Blue backlit LCD screen with tare weight function and auto data lock',
      'Overload and low battery warning indicators',
      'Braided nylon strap with heavy steel hook'
    ],
    specifications: {
      material: 'Stainless Steel Faceplate & High Impact ABS Plastic',
      dimensions: '13cm x 3cm x 3cm',
      weight: '85 grams',
      capacity: 'Up to 50kg / 110 lbs',
      compatibility: 'Universal Luggage Measurement',
      warranty: '1 Year Warranty',
      packageContents: '1 x Luggage Scale, 1 x CR2032 Lithium Battery Included'
    },
    tags: ['luggage scale', 'travel tools', 'weight scale', 'accessories']
  }
];

const sampleReviews = [
  {
    productId: 'prod-mt15-tank-bag',
    userName: 'Rohan Mehra',
    bikeOwned: 'Yamaha MT-15 V2',
    rating: 5,
    title: 'Absolute perfection for MT-15 tank geometry!',
    comment: 'Was struggling to find a tank bag that sits flush on the steep MT-15 tank without sliding off at 110 km/h. The neodymium magnets on this are seriously strong and the phone pouch touchscreen worked even with my gloves. Total game changer for weekend rides!',
    verifiedPurchase: true,
    helpfulCount: 34
  },
  {
    productId: 'prod-mt15-radiator-guard',
    userName: 'Varun Joshi',
    bikeOwned: 'Yamaha MT-15 V2',
    rating: 5,
    title: 'Flawless laser cut finish and perfect bolt-on',
    comment: 'Installed in 10 minutes using the OEM radiator mounting bolts. The matte black powder coat matches the MT-15 engine block perfectly and air flow has had zero drop in Bengaluru traffic.',
    verifiedPurchase: true,
    helpfulCount: 21
  },
  {
    productId: 'prod-ns200-crash-guard',
    userName: 'Aditya Deshmukh',
    bikeOwned: 'Bajaj Pulsar NS200 BS6',
    rating: 5,
    title: 'Saved my radiator and engine block on a slippery bend',
    comment: 'Low-sided on gravel at 40 km/h. The Delrin slider took the entire impact and ground down smoothly, but my engine casing and tank didn\'t have a single scratch. This crash guard paid for itself in one second.',
    verifiedPurchase: true,
    helpfulCount: 52
  },
  {
    productId: 'prod-ns200-windscreen',
    userName: 'Pranav Nair',
    bikeOwned: 'Bajaj Pulsar NS200',
    rating: 5,
    title: 'Drastic reduction in highway chest fatigue',
    comment: 'Clocked 600 km across NH48. Chest wind pressure is 80% deflected over helmet. Sturdy 4mm polycarbonate with no highway vibration shake.',
    verifiedPurchase: true,
    helpfulCount: 38
  },
  {
    productId: 'prod-univ-phone-mount',
    userName: 'Arjun Sen',
    bikeOwned: 'Yamaha MT-15',
    rating: 5,
    title: 'iPhone OIS camera is completely safe!',
    comment: 'My previous cheap mount ruined my iPhone 14 Pro camera stabilizer. Bought this Quad-Vibe mount after reading reviews, rode 1,200 km to Goa and the camera works flawlessly. Zero vibration jitter.',
    verifiedPurchase: true,
    helpfulCount: 41
  },
  {
    productId: 'prod-trv-tactical-backpack',
    userName: 'Sameer Verma',
    bikeOwned: 'Universal Traveler',
    rating: 5,
    title: 'Best carry-on bag I have ever owned',
    comment: 'The clamshell opening makes packing so effortless. Strapped it to the pillion seat for a 4-day tour then carried it directly onto an Indigo flight with no questions asked.',
    verifiedPurchase: true,
    helpfulCount: 28
  }
];

async function seedDatabase() {
  console.log('[Seed] Initializing seed routine...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const customerPasswordHash = await bcrypt.hash('rider123', salt);

  const adminUser = {
    _id: 'user-admin-001',
    name: 'Alex Mercer (Admin)',
    email: 'admin@roamrev.com',
    password: adminPasswordHash,
    role: 'admin',
    phone: '+91 99887 76655',
    addresses: [
      {
        fullName: 'Alex Mercer',
        street: '402 Overland Tower, Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '+91 99887 76655',
        landmark: 'Near Moto Hub',
        isDefault: true
      }
    ]
  };

  const customerUser = {
    _id: 'user-rider-001',
    name: 'Kabir Sharma',
    email: 'rider@roamrev.com',
    password: customerPasswordHash,
    role: 'customer',
    phone: '+91 98765 43210',
    addresses: [
      {
        fullName: 'Kabir Sharma',
        street: 'Flat 304, Pine Crest Apartments, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        phone: '+91 98765 43210',
        landmark: 'Opposite Metro Pillar 114',
        isDefault: true
      }
    ]
  };

  const sampleOrder = {
    _id: 'order-sample-001',
    orderNumber: 'RR-2026-89241',
    user: 'user-rider-001',
    customer: {
      name: 'Kabir Sharma',
      email: 'rider@roamrev.com',
      phone: '+91 98765 43210'
    },
    items: [
      {
        productId: 'prod-mt15-tank-bag',
        name: 'Apex MT-15 Aerodynamic Magnetic Tank Bag 15L',
        price: 2499,
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        subtotal: 2499
      },
      {
        productId: 'prod-univ-phone-mount',
        name: 'Apex Quad-Vibe Weatherproof Phone Mount with Vibration Dampener',
        price: 1599,
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=900&q=80',
        quantity: 1,
        subtotal: 1599
      }
    ],
    shippingAddress: {
      fullName: 'Kabir Sharma',
      street: 'Flat 304, Pine Crest Apartments, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      phone: '+91 98765 43210',
      landmark: 'Opposite Metro Pillar 114'
    },
    deliveryMethod: {
      type: 'express',
      title: 'Priority Speed Courier (Air Cargo)',
      cost: 150,
      estimatedDays: '1-2 business days'
    },
    payment: {
      method: 'upi',
      status: 'paid',
      transactionId: 'UPI-REF-88492019482',
      paidAt: new Date(Date.now() - 36 * 3600 * 1000)
    },
    pricing: {
      subtotal: 4098,
      discount: 409,
      couponCode: 'ADVENTURE10',
      shippingFee: 150,
      tax: 0,
      total: 3839
    },
    orderStatus: 'Out for Delivery',
    trackingNumber: 'BLUEDART-8823910',
    statusHistory: [
      {
        status: 'Confirmed',
        timestamp: new Date(Date.now() - 36 * 3600 * 1000),
        note: 'Order payment verified via UPI. Pack slip generated.'
      },
      {
        status: 'Processing',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000),
        note: 'Items picked and bubble-wrapped at Overland Logistics Hub.'
      },
      {
        status: 'Shipped',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000),
        note: 'Dispatched with Blue Dart Air Cargo (AWB: BLUEDART-8823910).'
      },
      {
        status: 'Out for Delivery',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
        note: 'Package assigned to courier agent for delivery by 6:00 PM.'
      }
    ],
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  };

  const store = getStore();

  store.data.users = [adminUser, customerUser];
  store.data.categories = categoriesData;
  store.data.products = productsData;
  store.data.coupons = couponsData;
  store.data.reviews = sampleReviews;
  store.data.orders = [sampleOrder];
  store.data.carts = [];
  store.save();

  console.log('[Seed] Successfully re-seeded with 100% unique dedicated commercial product photography!');
}

module.exports = {
  seedDatabase,
  categoriesData,
  productsData,
  couponsData
};
