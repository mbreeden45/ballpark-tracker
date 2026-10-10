// Generates data/ballparks.json from compact rows. Run: node scripts/build-ballparks.mjs
import { writeFileSync } from 'node:fs';
// id, mlbId, abbr, franchise, teamName, venue, city, state, lng, lat, league, division, opened, capacity, turf, primary, secondary, classic
const rows = [
['ari',109,'ARI','Arizona Diamondbacks','Diamondbacks','Chase Field','Phoenix','AZ',-112.0667,33.4453,'NL','West',1998,48686,'Natural grass','#A71930','#E3D4AD','Churro Dog'],
['atl',144,'ATL','Atlanta Braves','Braves','Truist Park','Cumberland','GA',-84.4677,33.8908,'NL','East',2017,41084,'Natural grass','#CE1141','#13274F','Fried Chicken Sandwich'],
['bal',110,'BAL','Baltimore Orioles','Orioles','Oriole Park at Camden Yards','Baltimore','MD',-76.6217,39.2839,'AL','East',1992,45971,'Natural grass','#DF4601','#000000','Boog\'s Pit Beef Sandwich'],
['bos',111,'BOS','Boston Red Sox','Red Sox','Fenway Park','Boston','MA',-71.0972,42.3467,'AL','East',1912,37755,'Natural grass','#BD3039','#0C2340','Fenway Frank'],
['chc',112,'CHC','Chicago Cubs','Cubs','Wrigley Field','Chicago','IL',-87.6553,41.9484,'NL','Central',1914,41649,'Natural grass','#0E3386','#CC3433','Chicago-Style Hot Dog'],
['cws',145,'CWS','Chicago White Sox','White Sox','Rate Field','Chicago','IL',-87.6339,41.8299,'AL','Central',1991,40615,'Natural grass','#27251F','#C4CED4','Polish Sausage with Grilled Onions'],
['cin',113,'CIN','Cincinnati Reds','Reds','Great American Ball Park','Cincinnati','OH',-84.5071,39.0975,'NL','Central',2003,42319,'Natural grass','#C6011F','#000000','Skyline Chili Cheese Coney'],
['cle',114,'CLE','Cleveland Guardians','Guardians','Progressive Field','Cleveland','OH',-81.6853,41.4962,'AL','Central',1994,34830,'Natural grass','#E31937','#0C2340','Bratwurst with Stadium Mustard'],
['col',115,'COL','Colorado Rockies','Rockies','Coors Field','Denver','CO',-104.9942,39.7559,'NL','West',1995,50144,'Natural grass','#33006F','#C4CED4','Rocky Mountain Oysters'],
['det',116,'DET','Detroit Tigers','Tigers','Comerica Park','Detroit','MI',-83.0485,42.339,'AL','Central',2000,41083,'Natural grass','#0C2340','#FA4616','Detroit Coney Dog'],
['hou',117,'HOU','Houston Astros','Astros','Daikin Park','Houston','TX',-95.3555,29.7573,'AL','West',2000,41168,'Natural grass','#002D62','#EB6E1F','Texas Brisket Sandwich'],
['kc',118,'KC','Kansas City Royals','Royals','Kauffman Stadium','Kansas City','MO',-94.4803,39.0517,'AL','Central',1973,37903,'Natural grass','#004687','#BD9B60','Burnt Ends Sandwich'],
['laa',108,'LAA','Los Angeles Angels','Angels','Angel Stadium','Anaheim','CA',-117.8827,33.8003,'AL','West',1966,45517,'Natural grass','#BA0021','#003263','Helmet Nachos'],
['lad',119,'LAD','Los Angeles Dodgers','Dodgers','Dodger Stadium','Los Angeles','CA',-118.24,34.0739,'NL','West',1962,56000,'Natural grass','#005A9C','#EF3E42','Dodger Dog'],
['mia',146,'MIA','Miami Marlins','Marlins','loanDepot park','Miami','FL',-80.2197,25.7781,'NL','East',2012,37446,'Natural grass','#00A3E0','#EF3340','Cuban Sandwich'],
['mil',158,'MIL','Milwaukee Brewers','Brewers','American Family Field','Milwaukee','WI',-87.9707,43.028,'NL','Central',2001,41900,'Natural grass','#12284B','#FFC52F','Bratwurst with Secret Stadium Sauce'],
['min',142,'MIN','Minnesota Twins','Twins','Target Field','Minneapolis','MN',-93.2778,44.9817,'AL','Central',2010,38544,'Natural grass','#002B5C','#D31145','Walleye Cakes'],
['nym',121,'NYM','New York Mets','Mets','Citi Field','Queens','NY',-73.8458,40.7571,'NL','East',2009,41922,'Natural grass','#002D72','#FF5910','Pat LaFrieda Steak Sandwich'],
['nyy',147,'NYY','New York Yankees','Yankees','Yankee Stadium','Bronx','NY',-73.9262,40.8296,'AL','East',2009,46537,'Natural grass','#003087','#E4002C','Lobel\'s Steak Sandwich'],
['ath',133,'ATH','Athletics','Athletics','Sutter Health Park','West Sacramento','CA',-121.513,38.5802,'AL','West',2000,14014,'Natural grass','#003831','#EFB21E','Farm-to-Fork Tri-Tip Sandwich'],
['phi',143,'PHI','Philadelphia Phillies','Phillies','Citizens Bank Park','Philadelphia','PA',-75.1665,39.9061,'NL','East',2004,42901,'Natural grass','#E81828','#002D72','Philly Cheesesteak'],
['pit',134,'PIT','Pittsburgh Pirates','Pirates','PNC Park','Pittsburgh','PA',-80.0057,40.4469,'NL','Central',2001,38747,'Natural grass','#FDB827','#27251F','Primanti Bros. Sandwich'],
['sd',135,'SD','San Diego Padres','Padres','Petco Park','San Diego','CA',-117.157,32.7076,'NL','West',2004,40209,'Natural grass','#2F241D','#FFC425','Baja Fish Tacos'],
['sf',137,'SF','San Francisco Giants','Giants','Oracle Park','San Francisco','CA',-122.3893,37.7786,'NL','West',2000,41915,'Natural grass','#FD5A1E','#27251F','Garlic Fries'],
['sea',136,'SEA','Seattle Mariners','Mariners','T-Mobile Park','Seattle','WA',-122.3325,47.5914,'AL','West',1999,47929,'Natural grass','#0C2C56','#005C5C','Dungeness Crab Roll'],
['stl',138,'STL','St. Louis Cardinals','Cardinals','Busch Stadium','St. Louis','MO',-90.1928,38.6226,'NL','Central',2006,44383,'Natural grass','#C41E3A','#0C2340','Toasted Ravioli'],
['tb',139,'TB','Tampa Bay Rays','Rays','Tropicana Field','St. Petersburg','FL',-82.6534,27.7683,'AL','East',1990,25000,'Artificial turf','#092C5C','#8FBCE6','Deviled Crab'],
['tex',140,'TEX','Texas Rangers','Rangers','Globe Life Field','Arlington','TX',-97.0847,32.7473,'AL','West',2020,40300,'Artificial turf','#003278','#C0111F','Boomstick Footlong Corn Dog'],
['tor',141,'TOR','Toronto Blue Jays','Blue Jays','Rogers Centre','Toronto','ON',-79.3894,43.6414,'AL','East',1989,39150,'Artificial turf','#134A8E','#E8291C','Poutine'],
['wsh',120,'WSH','Washington Nationals','Nationals','Nationals Park','Washington','DC',-77.0074,38.873,'NL','East',2008,41339,'Natural grass','#AB0003','#14225A','Ben\'s Chili Bowl Half-Smoke'],
];
const roofs = { ari: 'retractable', hou: 'retractable', mia: 'retractable', mil: 'retractable', sea: 'retractable', tex: 'retractable', tor: 'retractable', tb: 'dome' };
const zoneByState = { NY: 'America/New_York', PA: 'America/New_York', MA: 'America/New_York', MD: 'America/New_York', DC: 'America/New_York', GA: 'America/New_York', FL: 'America/New_York', OH: 'America/New_York', MI: 'America/New_York', ON: 'America/Toronto', IL: 'America/Chicago', MO: 'America/Chicago', WI: 'America/Chicago', MN: 'America/Chicago', TX: 'America/Chicago', CO: 'America/Denver', AZ: 'America/Phoenix', CA: 'America/Los_Angeles', WA: 'America/Los_Angeles' };
const keys = ['id','mlbId','abbr','franchise','teamName','venue','city','state','lng','lat','league','division','openedYear','capacity','turfType','primaryColor','secondaryColor','localClassicConcession'];
const out = rows.map((r) => { const o = Object.fromEntries(keys.map((k, i) => [k, r[i]])); const { lng, lat, ...rest } = o; const { id, mlbId, abbr, franchise, teamName, venue, city, state, ...tail } = rest; return { id, mlbId, abbr, franchise, teamName, venue, city, state, coordinates: [lng, lat], ...tail, roof: roofs[id] ?? 'open', timeZone: zoneByState[state] }; });
writeFileSync(new URL('../data/ballparks.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(out.length);
