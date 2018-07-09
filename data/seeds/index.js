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

        // 1  New York => 1560.7188
        nyc_ny: {
            lat: 40.730610,
            lng: -73.935242
        },
        // 2  Chicago => 639.00992
        chicago_il: {
            lat: 41.881832,
            lng: -87.623177
        },
        // 3  Los Angeles => 398.4658
        los_angeles: {
            lat: 34.052235,
            lng: -118.243683
        },
        // 4  Philadelphia => 380.93088
        philly_pa: {
            lat: 39.952583,
            lng: -75.165222
        },
        // 5 Norfolk => 352.052
        norfolk_va: {
            lat: 36.850769,
            lng: -76.285873
        },
        // 6  Houston => 267.94856
        houston_tx: {
            lat: 29.761993,
            lng: -95.366302
        },
        // 7  San Francisco => 234.83439000000004
        san_fran: {
            lat: 37.7749,
            lng: -122.4194
        },
        // 8  San Diego => 195.56166
        san_diego_ca: {
            lat: 32.715736,
            lng: -117.161087
        },
        // 9 Washington, D.C. => 182.63016000000002
        washington_dc: {
            lat: 38.9072,
            lng: -77.0369
        },
        // 10 Honolulu => 182.10132
        honolulu_hi: {
            lat: 21.315603,
            lng: -157.858093
        },
        // 11 Portland => 171.26289000000003
        portland_or: {
            lat: 45.523064,
            lng: -122.676483
        },
        // 12  Dallas => 168.95875
        dallas_tx: {
            lat: 32.7767,
            lng: -96.7970
        },
        // 13  Milwaukee => 168.602295
        milwaukee_wi: {
            lat: 43.038902,
            lng: -87.906471
        },
        // 14 Cincinnati, OH => 136.92472
        cincinnati:{
            lat: 39.1031,
            lng: -84.5120
        },
        // 15 Madison => 127.02350999999999
        madison_wi: {
            lat: 43.073051,
            lng: -89.401230
        },
        // 16 Austin => 120.45194
        austin_tx: {
            lat: 30.2672,
            lng: -97.7431
        },
        // 17 Laredo => 120.14225999999998
        laredo_tx: {
            lat: 27.506748,
            lng: -99.502914
        },
        // 18 St. Paul => 118.53348000000001
        st_paul_mn: {
            lat: 44.949642,
            lng: -93.093124
        },
        // 19 San Antonio => 116.02871999999999
        san_antonio_tx: {
            lat: 29.4241,
            lng: -98.4936
        },
        // 20 Omaha => 115.88642
        omaha_ne: {
            lat: 41.257160,
            lng: -95.995102
        },
        // 21 Cleveland => 114.9405
        cleveland_oh: {
            lat: 41.505493,
            lng: -81.681290
        },
        // 22 Lincoln, NE => 113.46191999999999
        lincoln_ne:{
            lat: 40.8136,
            lng: -96.7026
        },
        // 23 Seattle => 113.06938499999998
        seattle:{
            lat: 47.6062,
            lng: -122.3321
        },
        // 24 Fresno => 112.30232999999998
        fresno_ca:{
            lat: 36.7378,
            lng: -119.7871
        },
        // 25 Tampa => 112.20035
        tampa:{
            lat: 27.9506,
            lng: -82.4572
        },
         // 26 Boston => 109.36497
         boston_ma: {
            lat: 42.361145,
            lng: -71.057083
        },
        // 27 Raleigh => 107.93688499999999
        raleigh_nc: {
            lat: 35.787743,
            lng: -78.644257
        },
        // 28 Nashville => 104.6319
        nashville_tn: {
            lat: 36.174465,
            lng: -86.767960
        },
        // 29 San Jose => 102.0674
        san_jose_ca: {
            lat: 37.3382,
            lng: -121.8863
        },
        // 30 Memphis => 89.28752
        memphis: {
            lat: 35.1495,
            lng: -90.0490
        },
        // 31 Columbus => 85.557045
        columbus: {
            lat: 39.9612,
            lng: -82.9988
        },
        // 32  Louisville => 84.67250000000001
        louisville: {
            lat: 38.2527,
            lng: -85.7585
        },
        // 33 Buffalo => 82.067265
        buffalo: {
            lat: 42.8864,
            lng: -78.8784
        },
        // 34 El Paso => 80.78016
        el_paso: {
            lat: 31.7619,
            lng: -106.4850
        },
        // 35 Jacksonville => 80.19765
        jacksonville: {
            lat: 30.3322,
            lng: -81.6557
        },
        // 36 Detroit => 78.7758
        detroit_mi: {
            lat: 42.331429,
            lng: -83.045753
        },
        // 37 Virginia Beach => 76.03893
        virginia_beach: {
            lat: 36.8529,
            lng: -75.9780
        },
        // 38 Miami => 71.75408
        miami: {
            lat: 25.7617,
            lng: -80.1918
        },
        // 39 Phoenix => 71.37274500000001
        phoenix: {
            lat: 33.4484,
            lng: -112.0740
        },
        // 40 Minneapolis => 70.55476
        minneapolis: {
            lat: 44.986656,
            lng: -93.258133
        },
        // 41 Mesa => 68.39923999999999
        mesa: {
            lat: 33.4152,
            lng: -111.8315
        },
        // 42 Baton Rouge => 67.2541
        baton_rouge: {
            lat: 30.4515,
            lng: -91.1871
        },
        // 43 Tucson => 67.183125
        tucson: {
            lat: 32.2226,
            lng: -110.9747
        },
        // 44 Kansas City => 66.26934
        kansas_city: {
            lat: 39.0997,
            lng: -94.5786
        },
        // 45 Arlington, Virginia => 65.061795
        arlington_va: {
            lat: 38.8816,
            lng: -77.0910
        },
        // 46 Colorado Springs => 64.9774
        colorado_springs: {
            lat: 38.8339,
            lng: -104.8214
        },
        // 47 Atlanta => 64.6765
        atlanta: {
            lat: 33.7490,
            lng: -84.3880
        },
        // 48 Orlando => 63.74516
        orlando: {
            lat: 28.5383,
            lng: -81.3792
        },
        // 49 Sacramento => 63.432590000000005
        sacramento_ca:{
            lat: 38.5816,
            lng: -121.4944
        },
        // 50 Lubbock TX => 62.245
        lubbock_tx:{
            lat: 33.5779,
            lng: -101.8552
        },
        // 51 Albuquerque  => 59.96045
        albuquerque:{
            lat: 35.0844,
            lng: -106.6504
        },
        // 52 Lexington  => 58.88975500000001
        lexington:{
            lat: 38.0406,
            lng: -84.5037
        },
        // 53 Glendale AZ  => 56.96295
        glendale_az:{
            lat: 33.5387,
            lng: -112.1860
        },
        // 54 Henderson  => 55.75030499999999
        henderson_nv:{
            lat: 36.0395,
            lng: -114.9817
        },
        // 55 Oakland  => 55.11649
        oakland:{
            lat: 37.8044,
            lng: -122.2711
        },
        // 56 Fort Worth  => 54.50835
        fort_worth:{
            lat: 32.7555,
            lng: -97.3308
        },
        // 57 Pittsburgh  => 53.61768000000001
        pittsburgh:{
            lat: 40.4406,
            lng: -79.9959
        },
        // 58 St Petersburg Fl  => 53.004594999999995
        st_petersburgh:{
            lat: 27.7676,
            lng: -82.6403
        },
        // 59 Oklahoma City  => 52.75654
        oklahoma_city:{
            lat: 35.4676,
            lng: -97.5164
        },
        // 60 Denver  => 52.435275
        denver:{
            lat: 39.7392,
            lng: -104.9903
        },
        // 61 Stockton CA  => 51.210425
        stockton_ca:{
            lat: 37.9577,
            lng: -121.2908
        },
        // 62 Durham NC => 50.298605
        durham_nc:{
            lat: 35.9940,
            lng: -78.8986
        },
        // 63 Baltimore => 49.61408
        baltimore:{
            lat: 39.2904,
            lng: -76.6122
        },
        // 64 Charlotte => 48.154095
        charlotte:{
            lat: 35.2271,
            lng: -80.8431
        },
        // 65 Riverside => 47.50095
        riverside:{
            lat: 33.9806,
            lng: -117.3755
        },
        // 66 Chesapeake => 46.277159999999995
        chesapeake:{
            lat: 36.7682,
            lng: -76.2875
        },
        // 67 Reno NV => 46.20496
        reno_nv:{
            lat: 39.5296,
            lng: -119.8138
        },
        // 68 Corpus Christi => 44.39475000000001
        corpus_christi:{
            lat: 27.8006,
            lng: -97.3964
        },
        // 69 Tulsa OK => 43.85808000000001
        tulsa_ok:{
            lat: 36.1540,
            lng: -95.9928
        },
        // 70 Plano TX => 43.104
        plano_tx:{
            lat: 33.0198,
            lng: -96.6989
        },
        // 71 St Louis => 42.696855000000006
        st_louis:{
            lat: 38.6270,
            lng: -90.1994
        },
        // 72 Chandler => 40.85025
        chandler:{
            lat: 33.3062,
            lng: -111.8413
        },
        // 73 Las Vegas => 40.60953
        las_vegas:{
            lat: 36.1699,
            lng: -115.1398
        },
        // 74 Anchorage => 39.41002
        anchorage:{
            lat: 61.2181,
            lng: -149.9003
        },
        // 75 Long Beach CA => 38.626560000000005
        long_beach:{
            lat: 33.7701,
            lng: -118.1937
        },
        // 76 Richmond VA => 38.05637
        richmond_va:{
            lat: 37.5407,
            lng: -77.4360
        },
        // 77 Santa Ana Ca => 35.841435000000004
        santa_ana_ca:{
            lat: 33.7455,
            lng: -117.8677
        },
        // 78 Newark => 35.6205
        newark:{
            lat: 40.7357,
            lng: -74.1724
        },
        // 79 Jersey City => 35.29253
        jersey_city:{
            lat: 40.7282,
            lng: -74.0776
        },
        // 80 Hialeah_FL => 34.94145
        hialeah_fl:{
            lat: 25.8576,
            lng: -80.2781
        },
        // 81 Irvine CA => 34.755
        irvine_ca:{
            lat: 33.6846,
            lng: -117.8265
        },
        // 82 Bakersfield CA => 33.721959999999996
        bakersfield_ca:{
            lat: 35.3733,
            lng: -119.0187
        },
        // 83 Arlington TX => 32.463454999999996
        arlington_tx:{
            lat: 32.7357,
            lng: -97.1081
        },
        // 84 New Orleans => 32.2167
        new_orleans:{
            lat: 29.9511,
            lng: -90.0715
        },
        // 85 Garland TX => 26.504720000000002
        garland_tx:{
            lat: 32.9126,
            lng: -96.6389
        },
        // 86 Chula Vista CA => 25.9682
        chula_vista:{
            lat: 32.6401,
            lng: -117.0842
        },
        // 87 Aurora CO => 25.427989999999998
        aurora_co:{
            lat: 39.7294,
            lng: -104.8319
        },
        // 88 North Las Vegas => 25.402125
        north_las_vegas:{
            lat: 36.1989,
            lng: -115.1175
        },
        // 89 Anaheim CA => 25.142529999999997
        anaheim_ca:{
            lat: 33.8366,
            lng: -117.9143
        },
        // 90 Fremont CA => 24.33753
        fremont_ca:{
            lat: 37.5483,
            lng: -121.9886
        },
        // 91 Boie => 21.5731
        boise:{
            lat: 43.6150,
            lng: -116.2023
        },
        // 92 Greensboro NC => 21.29072
        greensboro_nc:{
            lat: 36.0726,
            lng: -79.7920
        },
        // 93 Toledo OH => 19.4691
        toledo_oh:{
            lat: 41.6528,
            lng: -83.5379
        },
        // 94 Wichita KS => 18.7115
        wichita_ks:{
            lat: 37.6872,
            lng: -97.3301
        },
        // 95 Scottsdate AZ => 17.850675
        scottsdale_az:{
            lat: 33.4942,
            lng: -111.9261
        },
        // 96 Irving TX => 14.171579999999999
        irving_tx:{
            lat: 32.8140,
            lng: -96.9489
        },
        // 97 Winston-Salem NC => 14.127119999999998
        winston_salem_nc:{
            lat: 36.0999,
            lng: -80.2442
        },
        //  Fayeteville (97 to support Dan for testing)
        fayeteville_ak:{
            lat: 36.081339,
            lng: -94.174614
        }
    }
}

module.exports = courts;