export interface USStateData {
  name: string;
  code: string;
  counties: string[]; // US equivalent of Nigeria LGA
  cities: string[];
}

export const US_LOCATIONS: Record<string, USStateData> = {
  Delaware: {
    name: "Delaware",
    code: "DE",
    counties: ["New Castle County", "Kent County", "Sussex County"],
    cities: ["Wilmington", "Newark", "Dover", "New Castle", "Middletown", "Bear"],
  },
  Texas: {
    name: "Texas",
    code: "TX",
    counties: ["Harris County", "Dallas County", "Tarrant County", "Bexar County", "Travis County", "Collin County", "Denton County", "El Paso County"],
    cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Plano"],
  },
  California: {
    name: "California",
    code: "CA",
    counties: ["Los Angeles County", "San Diego County", "Orange County", "Riverside County", "San Bernardino County", "Santa Clara County", "Alameda County", "Sacramento County", "San Francisco County"],
    cities: ["Los Angeles", "San Francisco", "Ontario", "San Diego", "San Jose", "Sacramento", "Long Beach", "Oakland", "Fresno"],
  },
  "New York": {
    name: "New York",
    code: "NY",
    counties: ["New York County (Manhattan)", "Kings County (Brooklyn)", "Queens County", "Bronx County", "Richmond County (Staten Island)", "Nassau County", "Suffolk County", "Westchester County", "Erie County", "Monroe County"],
    cities: ["New York City", "Brooklyn", "Queens", "Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers"],
  },
  "New Jersey": {
    name: "New Jersey",
    code: "NJ",
    counties: ["Essex County", "Hudson County", "Bergen County", "Middlesex County", "Passaic County", "Union County", "Camden County", "Mercer County"],
    cities: ["Newark", "Jersey City", "Elizabeth", "Edison", "Paterson", "Trenton", "Secaucus", "Clifton"],
  },
  Florida: {
    name: "Florida",
    code: "FL",
    counties: ["Miami-Dade County", "Broward County", "Palm Beach County", "Hillsborough County", "Orange County", "Duval County", "Pinellas County", "Lee County"],
    cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Hialeah", "Tallahassee", "St. Petersburg"],
  },
  Georgia: {
    name: "Georgia",
    code: "GA",
    counties: ["Fulton County", "Gwinnett County", "Cobb County", "DeKalb County", "Chatham County", "Clayton County", "Richmond County"],
    cities: ["Atlanta", "Savannah", "Augusta", "Columbus", "Macon", "Athens", "Sandy Springs"],
  },
  Illinois: {
    name: "Illinois",
    code: "IL",
    counties: ["Cook County", "DuPage County", "Lake County", "Will County", "Kane County", "McHenry County", "Winnebago County"],
    cities: ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Springfield", "Peoria", "Elgin"],
  },
  Pennsylvania: {
    name: "Pennsylvania",
    code: "PA",
    counties: ["Philadelphia County", "Allegheny County", "Montgomery County", "Bucks County", "Delaware County", "Lancaster County", "Chester County"],
    cities: ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Scranton", "Erie", "Bethlehem", "Lancaster"],
  },
  Washington: {
    name: "Washington",
    code: "WA",
    counties: ["King County", "Pierce County", "Snohomish County", "Spokane County", "Clark County", "Thurston County"],
    cities: ["Seattle", "Tacoma", "Spokane", "Bellevue", "Kent", "Everett", "Renton", "Vancouver"],
  },
  Ohio: {
    name: "Ohio",
    code: "OH",
    counties: ["Franklin County", "Cuyahoga County", "Hamilton County", "Summit County", "Montgomery County", "Lucas County"],
    cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  },
  "North Carolina": {
    name: "North Carolina",
    code: "NC",
    counties: ["Mecklenburg County", "Wake County", "Guilford County", "Forsyth County", "Cumberland County", "Durham County", "Buncombe County"],
    cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Wilmington"],
  },
  Michigan: {
    name: "Michigan",
    code: "MI",
    counties: ["Wayne County", "Oakland County", "Macomb County", "Kent County", "Genesee County", "Washtenaw County", "Ingham County"],
    cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing"],
  },
  Virginia: {
    name: "Virginia",
    code: "VA",
    counties: ["Fairfax County", "Prince William County", "Virginia Beach (City)", "Loudoun County", "Chesterfield County", "Henrico County", "Norfolk (City)", "Arlington County"],
    cities: ["Richmond", "Virginia Beach", "Norfolk", "Chesapeake", "Arlington", "Alexandria", "Roanoke"],
  },
  Maryland: {
    name: "Maryland",
    code: "MD",
    counties: ["Montgomery County", "Prince George's County", "Baltimore County", "Baltimore City", "Anne Arundel County", "Howard County", "Frederick County"],
    cities: ["Baltimore", "Rockville", "Frederick", "Gaithersburg", "Bowie", "Hagerstown", "Annapolis"],
  },
  Massachusetts: {
    name: "Massachusetts",
    code: "MA",
    counties: ["Middlesex County", "Worcester County", "Essex County", "Suffolk County", "Norfolk County", "Bristol County", "Plymouth County"],
    cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "Quincy"],
  },
  Arizona: {
    name: "Arizona",
    code: "AZ",
    counties: ["Maricopa County", "Pima County", "Pinal County", "Yavapai County", "Yuma County", "Mohave County", "Coconino County"],
    cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Tempe"],
  },
  Colorado: {
    name: "Colorado",
    code: "CO",
    counties: ["Denver County", "El Paso County", "Arapahoe County", "Jefferson County", "Adams County", "Larimer County", "Boulder County"],
    cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Boulder"],
  },
  Tennessee: {
    name: "Tennessee",
    code: "TN",
    counties: ["Shelby County", "Davidson County", "Knox County", "Hamilton County", "Rutherford County", "Williamson County"],
    cities: ["Memphis", "Nashville", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro"],
  },
  Indiana: {
    name: "Indiana",
    code: "IN",
    counties: ["Marion County", "Lake County", "Allen County", "Hamilton County", "St. Joseph County", "Elkhart County", "Tippecanoe County"],
    cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington"],
  },
  Missouri: {
    name: "Missouri",
    code: "MO",
    counties: ["St. Louis County", "Jackson County", "St. Charles County", "St. Louis City", "Clay County", "Jefferson County", "Greene County"],
    cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"],
  },
  Minnesota: {
    name: "Minnesota",
    code: "MN",
    counties: ["Hennepin County", "Ramsey County", "Dakota County", "Anoka County", "Washington County", "Olmsted County", "St. Louis County"],
    cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park"],
  },
  Wisconsin: {
    name: "Wisconsin",
    code: "WI",
    counties: ["Milwaukee County", "Dane County", "Waukesha County", "Brown County", "Racine County", "Outagamie County", "Kenosha County"],
    cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton"],
  },
  Oregon: {
    name: "Oregon",
    code: "OR",
    counties: ["Multnomah County", "Washington County", "Clackamas County", "Lane County", "Marion County", "Jackson County", "Deschutes County"],
    cities: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Beaverton"],
  },
  Nevada: {
    name: "Nevada",
    code: "NV",
    counties: ["Clark County", "Washoe County", "Carson City", "Lyon County", "Elko County", "Douglas County"],
    cities: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City"],
  },
  Connecticut: {
    name: "Connecticut",
    code: "CT",
    counties: ["Fairfield County", "Hartford County", "New Haven County", "New London County", "Litchfield County", "Middlesex County", "Tolland County", "Windham County"],
    cities: ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk"],
  },
  Kentucky: {
    name: "Kentucky",
    code: "KY",
    counties: ["Jefferson County", "Fayette County", "Kenton County", "Boone County", "Warren County", "Hardin County", "Daviess County"],
    cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
  },
  Louisiana: {
    name: "Louisiana",
    code: "LA",
    counties: ["Orleans Parish", "East Baton Rouge Parish", "Jefferson Parish", "Caddo Parish", "Lafayette Parish", "Calcasieu Parish"],
    cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
  },
  Alabama: {
    name: "Alabama",
    code: "AL",
    counties: ["Jefferson County", "Mobile County", "Madison County", "Montgomery County", "Shelby County", "Tuscaloosa County"],
    cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  },
  "South Carolina": {
    name: "South Carolina",
    code: "SC",
    counties: ["Greenville County", "Richland County", "Charleston County", "Horry County", "Spartanburg County", "Lexington County", "York County"],
    cities: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Greenville"],
  },
  Utah: {
    name: "Utah",
    code: "UT",
    counties: ["Salt Lake County", "Utah County", "Davis County", "Weber County", "Washington County", "Cache County", "Tooele County"],
    cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem"],
  },
};

export const US_STATE_NAMES = Object.keys(US_LOCATIONS).sort();
