// Complete list of 47 insurance products categorized properly
export const productCategories = [
  {
    name: 'Property & Fire Insurance',
    products: [
      { type: 'fire_special_perils', name: 'Fire & Special Perils', icon: 'shield' },
      { type: 'fire_loss_of_profit', name: 'Fire Loss of Profit', icon: 'trending' },
      { type: 'burglary', name: 'Burglary Insurance', icon: 'lock' },
      { type: 'business_interruption', name: 'Business Interruption', icon: 'trending' },
      { type: 'business_package', name: 'Business Package', icon: 'package' },
      { type: 'industrial_all_risk', name: 'Industrial All Risk', icon: 'factory' },
      { type: 'shopkeepers', name: 'Shopkeepers Insurance', icon: 'shop' },
      { type: 'money_insurance', name: 'Money Insurance', icon: 'currency' },
      { type: 'plate_glass', name: 'Plate Glass Insurance', icon: 'glass' },
      { type: 'signage', name: 'Signage Insurance', icon: 'sign' }
    ]
  },
  {
    name: 'Engineering & Construction',
    products: [
      { type: 'contractors_all_risk', name: "Contractors' All Risk", icon: 'tools' },
      { type: 'erection_all_risk', name: 'Erection All Risk', icon: 'cog' },
      { type: 'contractors_plant_machinery', name: 'Contractors Plant & Machinery', icon: 'crane' },
      { type: 'boiler_pressure_plant', name: 'Boiler & Pressure Plant', icon: 'boiler' },
      { type: 'machinery_breakdown', name: 'Machinery Breakdown', icon: 'wrench' },
      { type: 'machinery_loss_of_profit', name: 'Machinery Loss of Profit', icon: 'gear' },
      { type: 'electronic_equipment', name: 'Electronic Equipment', icon: 'chip' },
      { type: 'delay_in_start_up', name: 'Delay in Start Up', icon: 'clock' }
    ]
  },
  {
    name: 'Liability Insurance',
    products: [
      { type: 'public_liability_industrial', name: 'Public Liability (Industrial)', icon: 'users' },
      { type: 'public_liability_non_industrial', name: 'Public Liability (Non-Industrial)', icon: 'users' },
      { type: 'commercial_general_liability', name: 'Commercial General Liability', icon: 'shield-check' },
      { type: 'product_liability', name: 'Product Liability', icon: 'package' },
      { type: 'professional_indemnity', name: 'Professional Indemnity', icon: 'briefcase' },
      { type: 'professional_indemnity_it', name: 'Professional Indemnity (IT)', icon: 'code' },
      { type: 'directors_officers', name: 'Directors & Officers', icon: 'user-tie' },
      { type: 'cyber_liability', name: 'Cyber Liability', icon: 'shield-check' },
      { type: 'pollution_legal_liability', name: 'Pollution Legal Liability', icon: 'leaf' },
      { type: 'carriers_legal_liability', name: 'Carriers Legal Liability', icon: 'truck' }
    ]
  },
  {
    name: 'Employee Benefits',
    products: [
      { type: 'group_health', name: 'Group Health', icon: 'heart' },
      { type: 'group_personal_accident', name: 'Group Personal Accident', icon: 'medical' },
      { type: 'group_term_life', name: 'Group Term Life', icon: 'life' },
      { type: 'workmen_compensation', name: "Workmen's Compensation", icon: 'hard-hat' },
      { type: 'employees_compensation', name: 'Employees Compensation', icon: 'badge' }
    ]
  },
  {
    name: 'Marine & Cargo',
    products: [
      { type: 'marine_cargo', name: 'Marine Cargo', icon: 'ship' },
      { type: 'marine_cargo_open_cover', name: 'Marine Cargo Open Cover', icon: 'container' },
      { type: 'marine_transit', name: 'Marine Transit', icon: 'route' },
      { type: 'hull_and_machinery', name: 'Hull & Machinery', icon: 'anchor' },
      { type: 'freight_insurance', name: 'Freight Insurance', icon: 'box' },
      { type: 'baggage_insurance', name: 'Baggage Insurance', icon: 'luggage' },
      { type: 'shopkeeper_marine', name: 'Shopkeeper Marine', icon: 'store' }
    ]
  },
  {
    name: 'Financial & Specialty',
    products: [
      { type: 'fidelity_guarantee', name: 'Fidelity Guarantee', icon: 'shield' },
      { type: 'trade_credit', name: 'Trade Credit Insurance', icon: 'credit' },
      { type: 'surety_insurance', name: 'Surety Insurance', icon: 'handshake' },
      { type: 'title_insurance_commercial', name: 'Title Insurance (Commercial)', icon: 'document' },
      { type: 'public_offering_securities', name: 'Public Offering Securities', icon: 'chart' },
      { type: 'stop_insurance', name: 'STOP Insurance', icon: 'stop' }
    ]
  },
  {
    name: 'Agricultural',
    products: [
      { type: 'livestock_cattle_animal', name: 'Livestock/Cattle/Animal', icon: 'cow' }
    ]
  }
]

// Flatten all products for easy lookup
export const allProducts = productCategories.flatMap(cat => cat.products)

// Get product by type
export const getProductByType = (type: string) => {
  return allProducts.find(p => p.type === type)
}

// Get category by product type
export const getCategoryByType = (type: string) => {
  return productCategories.find(cat =>
    cat.products.some(p => p.type === type)
  )
}