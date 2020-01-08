// display hours of service for specific date

$('.jquery-datepicker').datepicker();

document.getElementById("dp_button").addEventListener("click", function() {
    console.log("hi");

    var days = document.getElementsByClassName("jquery-datepicker__day");
    for (i = 0; i < days.length; i++) {
        days[i].addEventListener("click", function() {
            console.log("hello");
        });
    }
});

console.log(document.getElementById("dp_input").value);

var today = new Date();
var today1 = today.toString().split(" ", 4); 
const months = ["January", "February", "March", "April", "May",
 "June", "July", "August", "September", "October", "November", "December"];
document.getElementById("service").innerHTML = "Hours of Service for " + months[today.getMonth()] + " " + today1[2] + ", " + today1[3]; 

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

request2.open('GET', `https://www.hebcal.com/shabbat/?cfg=json&zip=10804&gy=${today.getFullYear()}&gm=${today.getMonth()+1}&gd=${dayToday}`, true); 

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

    var tevilaHour;
    var tevilaMinutes;
    var openHour;
    var openMinutes;

    if (day != 5 && !holiday) { // not friday or a holiday

        var time = data.items[lightingIndex].date; 
        var splitting = time.split('T');
        var lighting = (splitting[1].split('-'))[0].split(':'); 
        var hour = lighting[0];
        var minutes = lighting[1];
        if (day != 6 && !lastDayOfChag) { // not a saturday or last day of chag so tevila is 50 min after sunset
            var sunset = SunCalc.getTimes(new Date(), 40.941430, -73.793830).sunset;
            console.log(sunset);
            var splitSunset = sunset.toString().split(" ");
            console.log(splitSunset);
            var timeInString = splitSunset[4].split(":", 2);
            console.log(timeInString);
            var hr = Number(timeInString[0]);
            var min = Number(timeInString[1]);
            console.log(hr);
            console.log(min);

            tevilaHour = hr;
            tevilaMinutes = min + 50;
            if (tevilaMinutes >= 60) {
                tevilaMinutes = tevilaMinutes - 60;
                tevilaHour++;
            }

            if (tevilaMinutes > 0 && tevilaMinutes <= 30) {
                openHour = tevilaHour;
                openMinutes = 0;
            }
            else if (tevilaMinutes == 0) {
                openHour = tevilaHour - 1;
                openMinutes = 30;
            }
            else {
                openHour = tevilaHour;
                openMinutes = 30;
            }

            if (openHour > 12) {
                openHour = openHour - 12;
            }

            if (tevilaHour > 12) {
                tevilaHour = tevilaHour - 12;
            }
        }
        else { // saturday or last day of chag so opens 1 1/2 after candelighting
            tevilaHour = parseInt(hour, 10) + 1;
            tevilaMinutes = parseInt(minutes, 10) + 30;
            if (tevilaMinutes >= 60) {
                tevilaMinutes = tevilaMinutes - 60;
                tevilaHour++;
            }

            if (tevilaMinutes > 0 && tevilaMinutes <= 15) {
                tevilaMinutes = 15;
            }
            else if (tevilaMinutes > 15 && tevilaMinutes <= 30) {
                tevilaMinutes = 30;
            }
            else if (tevilaMinutes > 30 && tevilaMinutes <= 45) {
                tevilaMinutes = 45;
            }
            else {
                tevilaMinutes = 0;
                tevilaHour++;
            }

            if (tevilaHour > 12) {
                tevilaHour = tevilaHour - 12;
            }

            openHour = tevilaHour;
            openMinutes = tevilaMinutes;
        }

        var openText = openHour.toString() + ":" + (openMinutes < 10 ? "0" : "") + openMinutes.toString() + " PM";
        var tevilaText = tevilaHour.toString() + ":" + (tevilaMinutes < 10 ? "0" : "") + tevilaMinutes.toString() + " PM";
    }

    else {
        var openText = "-";
        var tevilaText = "-";
    }
    document.getElementById("open").innerHTML = openText;
    document.getElementById("tevila").innerHTML = tevilaText;

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

$('.carousel').carousel('cycle');
