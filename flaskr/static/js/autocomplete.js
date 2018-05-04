// global so that we can graph daily data on click
var dailyWeatherData;

$('#locationInput').autocomplete({
    paramName: 'prefix',
    serviceUrl: '/api/autocomplete',
    deferRequestBy: 80,
    onSelect: function(suggestion) {
        getForecast(suggestion);
    }
});

function getForecast(suggestion) {
    var forecastURL = '/api/forecast?location=' + 
            encodeURIComponent(suggestion.value);
    $.getJSON(forecastURL, function(data) {
        var forecastContainer = $('#forecastContainer');
        forecastContainer.fadeOut(300, function() {

            dailyWeatherData = formatWeatherData(data);

            var cityName = data.city.name;
            // display city name and current conditions
            // display current temp, humid, weather type
            // get stock photo as background for weather type
            var currentWeather = {};

            for(var i=0; i<5; i++) {
                var col = $('#forecast-day-' + i);
                var dateString = dailyWeatherData[i].dayOfWeek + ', ' +
                        dailyWeatherData[i].date;
                var highString = Math.round(dailyWeatherData[i].high);
                var lowString = Math.round(dailyWeatherData[i].low);
                var descString = 
                        dailyWeatherData[i].desc.charAt(0).toUpperCase() +
                        dailyWeatherData[i].desc.slice(1);
                var humidString = 'Peak Humidity: ' + 
                        dailyWeatherData[i].peakHumid.toFixed(1) + '%';
                var windString = 'Peak Wind Speed: ' + 
                        dailyWeatherData[i].peakWind.toFixed(1) + 'mph';
                var iconImg = '<img src="http://openweathermap.org/img/w/' +
                        dailyWeatherData[i].icon + '.png"/>';
                col.find('.forecast-date').text(dateString);
                col.find('.forecast-temp-high').text(highString);
                col.find('.forecast-temp-low').text(lowString);
                col.find('.forecast-desc').text(descString);
                col.find('.forecast-humid').text(humidString);
                col.find('.forecast-wind').text(windString);
                col.find('.forecast-icon').html(iconImg);
            }

            // make the forecast visible only after the content is loaded
            forecastContainer.removeClass('hide');
            forecastContainer.fadeIn(300);
        });
    });
}

function formatWeatherData(data) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 
                'Thursday', 'Friday', 'Saturday'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
                  'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    var dailyWeather = []; // contains data for each day in forecast
    var forecastDays = {}; // keeps track of days already in dailyWeather
    for(var i=0; i<data.list.length; i++) {
        var weatherReport = reformat3Hour(data.list[i]);
        var dayOfMonth = weatherReport.dt.getDate().toString();
        if(dayOfMonth in forecastDays) {
            var currentDay = dailyWeather[dailyWeather.length-1];
            if(currentDay.high < weatherReport.high) {
                currentDay.high = weatherReport.high;
            }
            if(currentDay.low > weatherReport.low) {
                currentDay.low = weatherReport.low;
            }
            if(currentDay.peakHumid < weatherReport.humid) {
                currentDay.peakHumid = weatherReport.humid;
            }
            if(currentDay.peakWind < weatherReport.wind) {
                currentDay.peakWind = weatherReport.wind;
            }
            currentDay.dataPoints.push(weatherReport);
        } else {
            forecastDays[dayOfMonth] = dailyWeather.length;
            dailyWeather.push({
                'high': weatherReport.high,
                'low': weatherReport.low,
                'peakHumid': weatherReport.humid,
                'peakWind': weatherReport.wind,
                'dataPoints': [weatherReport],
                'dayOfWeek': days[weatherReport.dt.getDay()],
                'date': months[weatherReport.dt.getMonth()] + ' ' + 
                        weatherReport.dt.getDate().toString()
            });
        }

        // fill first partial day up to 8 3-hour data points so that graphing
        // works the same for all days
        var prevDay = dailyWeather[dailyWeather.length-2];
        if(dailyWeather.length > 1 && prevDay.dataPoints.length < 8) {
            prevDay.dataPoints.push(weatherReport);
        }
    }
    
    // select weather description based on current or mid-day weather
    // note: we're only guaranteed full days of data for indices 1-4
    dailyWeather[0].main = dailyWeather[0].dataPoints[0].main;
    dailyWeather[0].desc = dailyWeather[0].dataPoints[0].desc;
    dailyWeather[0].icon = dailyWeather[0].dataPoints[0].icon;
    for(var i=1; i<5; i++) {
        dailyWeather[i].main = dailyWeather[i].dataPoints[4].main;
        dailyWeather[i].desc = dailyWeather[i].dataPoints[4].desc;
        dailyWeather[i].icon = dailyWeather[i].dataPoints[4].icon;
    }

    return dailyWeather;
}

function reformat3Hour(weatherReport) {
    return {
        'dt': new Date(weatherReport.dt*1000),
        'high' : convertToF(weatherReport.main.temp_max),
        'low' : convertToF(weatherReport.main.temp_min),
        'humid' : weatherReport.main.humidity,
        'wind' : weatherReport.wind.speed,
        'main' : weatherReport.weather[0].main,
        'desc' : weatherReport.weather[0].description,
        'icon' : weatherReport.weather[0].icon
    }
}

function convertToF(temp) {
    return (temp - 273.15) * 1.8 + 32;
}

