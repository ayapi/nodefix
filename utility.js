var moment = require('moment');

exports.getUTCTimeStamp = function (datetime) {
	return moment(datetime||new Date).utc().format("YYYYMMDD-HH:mm:ss.SSS")
};

exports.getCheckSum = function (str) {
	
	var checkSum = 0;
	
	var checkSumStr = "";

	for (var i = 0; i < str.length; i++)
	{
		checkSum += str.charCodeAt(i);
	}

	checkSum = (checkSum % 256) + "";
	
	if (checkSum.length === 1)
	{
		checkSumStr = "00" + checkSum;
	}
	else if (checkSum.length === 2)
	{
		checkSumStr = "0" + checkSum;
	}
	else
	{
		checkSumStr = checkSum;
	}
	
	return checkSumStr;
};