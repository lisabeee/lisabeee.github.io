// display hours of service for specific date

var today = new Date();
var today1 = today.toString().split(" ", 4); 
document.getElementById("service").innerHTML = "Hours of Service for " + today1[1] + " " + today1[2] + ", " + today1[3]; 

// get tomorrow's date
// to check if erev chag or last day of chag
var tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

const request1 = new XMLHttpRequest();
const request2 = new XMLHttpRequest();

var tom = tomorrow.toString().split(" ", 4);

var tomDay = parseInt(tom[2]);
var tomYear = tomorrow.getFullYear();
var tomMonth = tomorrow.getMonth() + 1;

var holidayTom = false; // assume false

// find out information about tomorrow
request1.open('GET', `https://www.hebcal.com/shabbat/?cfg=json&zip=10804&gy=${tomYear}&gm=${tomMonth}&gd=${tomDay}`, true);

request1.onload = function() {
    var data = JSON.parse(this.response);

    // find if tom is a holiday
    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].yomtov == true) {
            holidayTom = true;
            i = data.items.length;
        }
    }
}

request1.send();

// find out information about today

var dayToday = parseInt(today1[2]);
if (today.getDay() == 6) { // check fridays candlelighting because API has different response on sat
    dayToday--;
}

request2.open('GET', `https://www.hebcal.com/shabbat/?cfg=json&zip=10804&gy=${today.getYear()}&gm=${today.getMonth()+1}&gd=${dayToday}`, true); 

request2.onload = function() {

    // for opening hours and earliest tevilla
    var day = today.getDay();
    var data = JSON.parse(this.response);

    var lightingIndex = -1;

    // find which element in the array of the response 
    // has the lighting time for the week
    for (var i = 0; i < data.items.length; i++) { 
        if (data.items[i].category == "candles") {
            lightingIndex = i;
            i = data.items.length;
        }
    }

    var holiday;
    var lastDayOfChag;

    // find if it's a holiday
    if (holidayTom) {
        holiday = true;
    }
    else {
        holiday = false;
    }

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].yomtov == true) {
            if (holidayTom == false) {
                lastDayOfChag = true;
            }
        }
    }

    if (day != 5 && !holiday) { // not friday or a holiday

        var time = data.items[lightingIndex].date; 
        var splitting = time.split('T');
        var lighting = (splitting[1].split('-'))[0].split(':'); 
        var hour = lighting[0];
        var minutes = lighting[1];
        if (day != 6 && !lastDayOfChag) { // not a saturday or last day of chag so opens 45 min after candlelighting
            var openHour = parseInt(hour, 10);
            var openMinutes = parseInt(minutes, 10) + 45;
            if (openMinutes >= 60) {
                openMinutes = openMinutes - 60;
                openHour++;
            }

            if (openHour > 12) {
                openHour = openHour - 12;
            }
        }
        else { // saturday or last day of chag so opens 1 1/2 after candelighting
            var openHour = parseInt(hour, 10) + 1;
            var openMinutes = parseInt(minutes, 10) + 30;
            if (openMinutes >= 60) {
                openMinutes = openMinutes - 60;
                openHour++;
            }

            if (openHour > 12) {
                openHour = openHour - 12;
            }
        }

        var text = openHour.toString() + ":" + (openMinutes < 10 ? "0" : "") + openMinutes.toString() + " PM";
    }

    else {
        var text = "-";
    }
    document.getElementById("open").innerHTML = text;
    document.getElementById("tevila").innerHTML = text;

    // for last bath, last shower, and closing time

    var month = today.getMonth();

    let season;
    if (month >= 4 && month <= 7) {
        season = 1; // summer
    }
    else {
        season = 0; // winter
    }

    if (season && day != 5 && !holiday) {
        document.getElementById("closes").innerHTML = "11:00 PM";
        document.getElementById("last bath").innerHTML = "10:00 PM";
        document.getElementById("last shower").innerHTML = "10:30 PM";
    }
    else if (!season && day != 5 && !holiday) {
        document.getElementById("closes").innerHTML = "10:00 PM";
        document.getElementById("last bath").innerHTML = "9:00 PM";
        document.getElementById("last shower").innerHTML = "9:30 PM";
    }
    else {
        document.getElementById("closes").innerHTML = "-";
        document.getElementById("last bath").innerHTML = "-";
        document.getElementById("last shower").innerHTML = "-";
    }
    
}

request2.send();