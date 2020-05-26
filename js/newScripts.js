// want to display hours of service for specific date
// use either today's date or selected date 

$('.jquery-datepicker').datepicker();

// date is today
// get date and split it into month, day and year
// last parameter is false because using today's date, not date from calendar
// calls setDisplay to edit text and calculateTimes for calculations
var today = new Date();
var todaySplit = today.toString().split(" ", 4);
setDisplay(today.getMonth(), todaySplit[2], todaySplit[3], false);
calculateTimes(today.getMonth(), todaySplit[2], todaySplit[3], false);

// called every time the 'Get Hours' button in pop up is clicked
// uses selected date in calendar
// last parameter is true because using selected date
// calls setDisplay to edit text and calculateTimes for calculations
$($("#modal-placeholder").on("click", "#btn-primary", function() {
    var date = document.getElementById("dp_input").value;
    var splitDate = date.toString().split("/");
    var month = splitDate[0];
    var day = splitDate[1];
    var year = splitDate[2];

    // month-1 because datepicker starts at 1 but javascript starts at 0
    setDisplay(month-1, day, year, true);
    calculateTimes(month-1, day, year, true);
}));

// edits website html to print the correct date 
function setDisplay(month, day, year, dateFromDatePicker) {

    // display date in text form 
    const months = ["January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October", "November", "December"];
    if (!dateFromDatePicker) { // using today's date so don't have calendar popup open
        document.getElementById("service").innerHTML = "Hours of Service for " + months[month] + " " + day + ", " + year; 
    }
    else { // date from date picker so need to edit html of pop-up
        document.getElementById("selected-date-modal").innerHTML = "Hours of Service for " + months[month] + " " + day + ", " + year; 
        document.getElementById("selected-date-modal-2").innerHTML = "Hours of Service for " + months[month] + " " + day + ", " + year; 
    }

}

// main method to calculate times for specific day
// calls helper methods for each time needed
function calculateTimes(month, day, year, dateFromDatePicker) {

    // get tomorrow's date
    // call infoAboutTom to find out if tomorrow is a holiday 
    var tomorrow = new Date(year, month, day);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var holidayTom = infoAboutTom(tomorrow);

    // set up API call
    const request = new XMLHttpRequest();

    // create a new day to use for API call
    // change date if Sat. since candle lighting comes from friday's time
    var today = new Date(year, month, day);
    var dayToday = new Date(year, month, day);
    if (dayToday.getDay() == 6) { // 6 = saturday, so need to change to friday by subtracting 1
        dayToday.setDate(today.getDate() - 1);
    }

    // three variables we need for helper methods
    // candleLighting defined in API call
    // lastDayOfChag may be changed in API call 
    var candleLighting;
    var holiday = holidayTom; // erev chag or a holiday if tomorrow is a holiday
    var lastDayOfChag = false;

    // make API call with dayToday so can account for saturday needing to call on friday's info
    // use all of dayToday info on chance that saturday was first day of the month
    request.open('GET', `https://www.hebcal.com/shabbat/?cfg=json&zip=10804&gy=${dayToday.getFullYear()}&gm=${dayToday.getMonth()+1}&gd=${dayToday.getDate()}`, false); 

    request.onload = function() {

        // for opening hours and earliest tevilla
        var data = JSON.parse(this.response);

        // start at -1 so we have a way of identifying when no index was found
        var lightingIndex = -1;

        // find element in the array of the response with lighting time for the week
        // get index of element 
        for (var i = 0; i < data.items.length; i++) { 
            if (data.items[i].category == "candles") {
                lightingIndex = i;
                i = data.items.length; // so stops looping when we find it
            }
        }

        // check if today is a yomtov and that tomorrow isn't a holiday, meaning it is last day of chag
        // sometimes yomtov will come up if it is during that week so check that it is actually today
        for (var i = 0; i < data.items.length; i++) {
            if (data.items[i].yomtov == true) {
                if (holidayTom == false) {
                    dayToday=today.toString().split(" ", 4);

                    var todayDay = parseInt(dayToday[2]);
                    var todayYear = today.getFullYear();
                    var todayMonth = today.getMonth() + 1;
                    const d = (todayDay < 10 ? "0" : "") + todayDay.toString();
                    const m = (todayMonth < 10 ? "0" : "") + todayMonth.toString();
                    const y = (todayYear < 10 ? "0" : "") + todayYear.toString();

                    if (data.items[i].date == `${y}-${m}-${d}`) {
                        lastDayOfChag = true;
                        i = data.items.length;
                    }
                }
            }
        }

        // get info about lighting times to use for other helper methods
        var time = data.items[lightingIndex].date; 
        var splitting = time.split('T');
        candleLighting = (splitting[1].split('-'))[0].split(':'); 
    }

    request.send();

    // call to calculate the tevila and opening time
    // pass today's date, array with candlelighting time, and three booleans
    calculateTevilaAndOpening(today, candleLighting, holiday, lastDayOfChag, dateFromDatePicker);
}

// calls API to find out if tomorrow is a holiday
// need for erev chag and to check if it is last day of chag
function infoAboutTom(tomDate) {

    // turn date into string
    var tomorrow = tomDate.toString().split(" ", 4);

    var tomDay = parseInt(tomorrow[2]);
    var tomYear = tomDate.getFullYear();
    var tomMonth = tomDate.getMonth() + 1;

    // variable to be returned - assume false
    var holidayTom = false; 

    const request = new XMLHttpRequest();

    // make API call 
    request.open('GET', `https://www.hebcal.com/shabbat/?cfg=json&zip=10804&gy=${tomYear}&gm=${tomMonth}&gd=${tomDay}`, false);

    request.onload = function() {
        var data = JSON.parse(this.response);
    
        // find if tom is a holiday
        for (var i = 0; i < data.items.length; i++) {
            if (data.items[i].yomtov == true) {
                const d = (tomDay < 10 ? "0" : "") + tomDay.toString();
                const m = (tomMonth < 10 ? "0" : "") + tomMonth.toString();
                const y = (tomYear < 10 ? "0" : "") + tomYear.toString();

                if (data.items[i].date == `${y}-${m}-${d}`) {
                    holidayTom = true;
                    i = data.items.length;
                }
            }
        }
    }
    
    request.send();

    return holidayTom;
}

// tevila and opening depend on each other
// regular day: tevila is 50 min after sunset 
// and opening is at least 30 min before tevila rounded to nearest 15 min
// post shab/chag: opens at least an hour and a half after lighting rounded to nearest 15
// and tevila is exactly when it opens
// friday/chag: appt only
function calculateTevilaAndOpening(date, candleLightingArray, holiday, lastDayOfChag, dateFromDatePicker) {
    var tevilaHour, tevilaMinutes, openHour, openMinutes;
    var tevilaText, openText;

    // add time to date for sunset calculation purposes
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0, 0);

    if (date.getDay() != 5 && !holiday) { // not friday or a holiday
        if (date.getDay() != 6 && !lastDayOfChag) { // not sat or last day of chag

            // regular day rules
            // tevila is based on sunset and opening is based on tevila
            var sunset = SunCalc.getTimes(date, 40.941430, -73.793830).sunset;
            var splitSunset = sunset.toString().split(" ");
            var timeInString = splitSunset[4].split(":", 2);
            var sunsetHour = Number(timeInString[0]);
            var sunsetMin = Number(timeInString[1]);

            // tevila = sunset + 50 min
            tevilaHour = sunsetHour;
            tevilaMinutes = sunsetMin + 50;
            if (tevilaMinutes >= 60) {
                tevilaMinutes -= 60;
                tevilaHour++;
            }

            if (tevilaHour > 12) {
                tevilaHour -= 12;
            }

            // open = at least 30 min before tevila, rounded to nearest 15 
            if (tevilaMinutes >= 0 && tevilaMinutes <= 14) {
                openHour = tevilaHour - 1;
                openMinutes = 30;
            }
            else if (tevilaMinutes >= 15 && tevilaMinutes <= 29) {
                openHour = tevilaHour - 1;
                openMinutes = 45;
            }
            else if (tevilaMinutes >= 30 && tevilaMinutes <= 44) {
                openHour = tevilaHour;
                openMinutes = 0
            }
            else {
                openHour = tevilaHour;
                openMinutes = 15;
            }

            if (openHour > 12) {
                openHour = openHour - 12;
            }

        }
        else { // sat or last day of chag

            // open based on candle lighting and tevila based on opening
            var candleLightingHour = parseInt(candleLightingArray[0],10);
            var candleLightingMin = parseInt(candleLightingArray[1],10);

            // open = at least 1 1/2 hour after CL, rounded to nearest 15 
            if (candleLightingMin >= 1 && candleLightingMin <= 15) {
                openHour = candleLightingHour+1;
                openMinutes = 45;
            }
            else if (candleLightingMin >= 16 && candleLightingMin <= 30) {
                openHour = candleLightingHour+2;
                openMinutes = 0;
            }
            else if (candleLightingMin >= 31 && candleLightingMin <= 45) {
                openHour = candleLightingHour+2;
                openMinutes = 15;
            }
            else {
                openHour = candleLightingHour+2;
                openMinutes = 30;

                if (candleLightingMin == 0) { // edge case - only add 1 to hour, not 2
                    openHour = candleLightingHour+1;
                }
            }

            if (openHour > 12) {
                openHour -= 12;
            }

            tevilaHour = openHour;
            tevilaMinutes = openMinutes
        }

        openText = openHour.toString() + ":" + (openMinutes < 10 ? "0" : "") + openMinutes.toString() + " PM";
        tevilaText = tevilaHour.toString() + ":" + (tevilaMinutes < 10 ? "0" : "") + tevilaMinutes.toString() + " PM";
    }

    else { // it is friday or a holiday so appt only
        openText = "-";
        tevilaText = "-";
    }

    // for display purposes
    if (!dateFromDatePicker) { // regular screen
        document.getElementById("tevila").innerHTML = tevilaText;
        document.getElementById("open").innerHTML = openText;
    }   
    else { // pop-up with calendar
        if (date.getDay() == 5 || holiday) { // display appt only text
            $('#customDateTimes').collapse("hide");
            $('#customDateApptOnly').collapse("show");
        }
        else { // display times text
            $('#customDateApptOnly').collapse("hide");
            document.getElementById("tevilah-modal").innerHTML = "Earliest Tevila: " + tevilaText;
            document.getElementById("opens-modal").innerHTML = "Opens: " + openText;
            $('#customDateTimes').collapse("show");
        }
    }
    
    // calculate closing based on tevila so call calculation function here
    calculateClosing(tevilaHour, tevilaMinutes, date, holiday, dateFromDatePicker);
}

// closing time based on tevila time
// approx. 2 hours after earliest tevila - either 10, 10:30 or 11
// last bath is 1 hr before closing, last shower is 30 min before closing
function calculateClosing(tevilaHour, tevilaMinutes, date, holiday, dateFromDatePicker) {

    var closingText;
    var lastBath;
    var lastShower;

    if (date.getDay() == 5 || holiday) { // friday or holiday so appt only
        closingText = "-";
        lastBath = "-";
        lastShower = "-";
    }
    else {
        if (tevilaHour < 8 || (tevilaHour == 8 && tevilaMinutes <= 14)) {
            closingText = "10:00 PM";
            lastBath = "9:00 PM";
            lastShower = "9:30 PM";
        }
        else if (tevilaHour > 8 || (tevilaHour == 8 && tevilaMinutes >= 45)) {
            closingText = "11:00 PM";
            lastBath = "10:00 PM";
            lastShower = "10:30 PM";
        }
        else {
            closingText = "10:30 PM";
            lastBath = "9:30 PM";
            lastShower = "10:00 PM";
        }
    }

    // for display purposes
    if (!dateFromDatePicker) { // regular screen
        document.getElementById("closes").innerHTML = closingText;
        document.getElementById("last bath").innerHTML = lastBath;
        document.getElementById("last shower").innerHTML = lastShower;
    }
    else { // pop-up with calendar
        if (date.getDay() == 5 || holiday) {
            $('#customDateTimes').collapse("hide");
            $('#customDateApptOnly').collapse("show");
        }
        else {
            $('#customDateApptOnly').collapse("hide");
            document.getElementById("closes-modal").innerHTML = "Closes: " + closingText;
            document.getElementById("bath-modal").innerHTML = "Last Bath: " + lastBath;
            document.getElementById("shower-modal").innerHTML = "Last Shower: " + lastShower;
            $('#customDateTimes').collapse("show");
        }
    }
}