// City with the most basketball courts in the US as of 2017 - 99 total
// According to http://parkscore.tpl.org/rankings_values.php#sm.00001dsqwmd787e0lqff5fuc4itod
// Ran this script on their page
/*
const HOOPS_PER_COURT = 2;
const _10K = 10000; let rows = $('.results-table tbody tr');
var courtsByC = [];
console.log("Top US Cities With Most Outdoor Basketball Courts")
	for (let i=0; i < rows.length; i++){
		let cols = $(rows[i]).children();
		let cityName = cols[1].textContent;
		let population = Number(cols[2].textContent.split(",").join("").toString());
		let courtsPer10k = Number(cols[7].textContent) / HOOPS_PER_COURT;
		let courtsCount = population * courtsPer10k / _10K;

		courtsByC.push({city: cityName, courtsCount});	
	}

	courtsByC.sort(sortByMostCourtsCount);
    
	courtsByC.forEach((court, idx) =>{
		console.log(`${idx+1} ${court.city} => ${court.courtsCount}`);
	})
 document.write(courts)

function sortByMostCourtsCount(c1, c2){
	return c2.courtsCount-c1.courtsCount;
}
*/
let courts = {
    USA: { 
        // Start with cities with at least 100 public courts => 25 cities

        // 1  New York => 1539.8260200000002
        nyc_ny: {
            lat: 40.730610,
            lng: -73.935242
        },
        // 2  Chicago => 623.6874
        chicago_il: {
            lat: 41.881832,
            lng: -87.623177
        },
        // 3  Philadelphia => 322.14417499999996
        philly_pa: {
            lat: 39.952583,
            lng: -75.165222
        },
        // 4  Houston => 259.84475
        houston_tx: {
            lat: 29.761993,
            lng: -95.366302
        },
        // 5  San Diego => 191.55919999999998
        san_diego_ca: {
            lat: 32.715736,
            lng: -117.161087
        },
        // 6  Milwaukee => 168.77016
        milwaukee_wi: {
            lat: 43.038902,
            lng: -87.906471
        },
        // 7  San Francisco => 160.97692999999998
        san_fran_ca: {
            lat: 37.773972,
            lng: -122.431297
        },
        // 8  Dallas => 160.559
        dallas_tx: {
            lat: 32.7767,
            lng: -96.7970
        },
        // 9  Los Angeles => 157.46168
        los_angeles: {
            lat: 34.052235,
            lng: -118.243683
        },
        // 10 St. Paul => 142.59264
        st_paul_mn: {
            lat: 44.949642,
            lng: -93.093124
        },
        // 11 Washington, D.C. => 132.0984
        washington_dc: {
            lat: 38.9072,
            lng: -77.0369
        },
        // 12 Laredo => 127.96052999999998
        laredo_tx: {
            lat: 27.506748,
            lng: -99.502914
        },
        // 13 Raleigh => 120.88552999999997
        raleigh_nc: {
            lat: 35.787743,
            lng: -78.644257
        },
        // 14 San Antonio => 120.88309
        san_antonio_tx: {
            lat: 29.4241,
            lng: -98.4936
        },
        // 15 Austin => 120.43598499999999
        austin_tx: {
            lat: 30.2672,
            lng: -97.7431
        },
        // 16 Madison => 119.03348999999999
        madison_wi: {
            lat: 43.073051,
            lng: -89.401230
        },
        // 17 Portland => 117.34076999999999
        portland_or: {
            lat: 45.523064,
            lng: -122.676483
        },
        // 18 Omaha => 116.1813
        omaha_ne: {
            lat: 41.257160,
            lng: -95.995102
        },
        // 19 Cleveland => 115.1268
        cleveland_oh: {
            lat: 41.505493,
            lng: -81.681290
        },
        // 20 Boston => 110.04423
        boston_ma: {
            lat: 42.361145,
            lng: -71.057083
        },
        // 21 Detroit => 105.0552
        detroit_mi: {
            lat: 42.331429,
            lng: -83.045753
        },
        // 22 Norfolk => 102.06925000000001
        norfolk_va: {
            lat: 36.850769,
            lng: -76.285873
        },
        // 23 Minneapolis => 101.9205
        minneapolis: {
            lat: 44.986656,
            lng: -93.258133
        },
        // 24 Nashville => 101.74005
        nashville_tn: {
            lat: 36.174465,
            lng: -86.767960
        },
        // 25 Honolulu => 100.1889
        honolulu_hi: {
            lat: 21.315603,
            lng: -157.858093
        },
        //49 Sacramento => 63.432590000000005 (I am currently here so populate as many courts for demo)
        sacramento_ca:{
            lat: 38.5816,
            lng: -121.4944
        },
        // Fayeteville
        fayeteville_ak:{
            lat: 36.081339,
            lng: -94.174614
        }
    }
}

module.exports = courts;